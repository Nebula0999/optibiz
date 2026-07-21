from io import BytesIO

from django.db.models import Count, F, Sum
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from apps.core.models import ReportGeneration
from apps.core.serializers import ReportGenerationSerializer


class BusinessScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    business_field = "business"

    def _get_user_business(self):
        user_business = getattr(self.request.user, "business", None)
        if self.request.user.is_superuser:
            return user_business
        if user_business is None:
            raise ValidationError({self.business_field: "User is not attached to a business."})
        return user_business

    def get_queryset(self):
        queryset = super().get_queryset()
        user_business = getattr(self.request.user, "business", None)
        if self.request.user.is_superuser:
            return queryset
        if user_business is None:
            return queryset.none()
        return queryset.filter(**{self.business_field: user_business})

    def perform_create(self, serializer):
        user_business = self._get_user_business()
        if self.business_field in serializer.fields:
            serializer.save(**{self.business_field: user_business})
            return
        serializer.save()


class DashboardViewSet(viewsets.ViewSet):
    """Dashboard statistics and analytics endpoints."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics for the user's business."""
        from apps.sales.models import Sale
        from apps.expenses.models import Expense
        from apps.inventory.models import Inventory
        from apps.customers.models import Customer
        
        user_business = request.user.business
        if not user_business:
            return Response({
                'total_revenue': 0,
                'total_expenses': 0,
                'profit': 0,
                'low_stock_items': 0,
                'active_customers': 0,
            })
        
        # Calculate revenue from sales this month
        today = timezone.now()
        first_day = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        sales = Sale.objects.filter(business=user_business, sale_date__gte=first_day)
        total_revenue = sales.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Calculate expenses this month
        expenses = Expense.objects.filter(business=user_business, expense_date__gte=first_day.date())
        total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate profit
        profit = total_revenue - total_expenses
        
        # Count low stock items
        low_stock_items = Inventory.objects.filter(
            business=user_business,
            quantity_available__lte=F('reorder_level')
        ).count()
        
        # Count active customers
        active_customers = Customer.objects.filter(business=user_business).count()
        
        return Response({
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'profit': float(profit),
            'low_stock_items': low_stock_items,
            'active_customers': active_customers,
        })

    @action(detail=False, methods=['get'], url_path='recent-sales')
    def recent_sales(self, request):
        """Get recent sales for the user's business."""
        from apps.sales.models import Sale
        from apps.sales.serializers import SaleSerializer
        
        user_business = request.user.business
        if not user_business:
            return Response({'results': []})
        
        limit = request.query_params.get('limit', 10)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 10
        
        sales = Sale.objects.filter(business=user_business).order_by('-sale_date')[:limit]
        serializer = SaleSerializer(sales, many=True)
        
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'], url_path='low-stock-alerts')
    def low_stock_alerts(self, request):
        """Get low stock inventory alerts."""
        from apps.inventory.models import Inventory
        from apps.inventory.serializers import InventorySerializer
        
        user_business = request.user.business
        if not user_business:
            return Response({'results': []})
        
        low_stock = Inventory.objects.filter(
            business=user_business,
            quantity_available__lte=F('reorder_level')
        ).order_by('quantity_available')
        
        serializer = InventorySerializer(low_stock, many=True)
        
        return Response({'results': serializer.data})


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_business(self, request):
        business = getattr(request.user, 'business', None)
        if not business:
            raise ValidationError({'business': 'User is not attached to a business.'})
        return business

    def _parse_dates(self, request):
        date_from_raw = request.query_params.get('date_from')
        date_to_raw = request.query_params.get('date_to')

        date_from = parse_date(date_from_raw) if date_from_raw else None
        date_to = parse_date(date_to_raw) if date_to_raw else None

        if date_from_raw and not date_from:
            raise ValidationError({'date_from': 'Use YYYY-MM-DD.'})
        if date_to_raw and not date_to:
            raise ValidationError({'date_to': 'Use YYYY-MM-DD.'})

        return date_from, date_to

    def _period_label(self, date_from, date_to):
        if date_from and date_to:
            return f"{date_from} to {date_to}"
        if date_from:
            return f"From {date_from}"
        if date_to:
            return f"Up to {date_to}"
        return "All time"

    def _log_report_generation(self, request, business, report_type, payload, date_from, date_to):
        ReportGeneration.objects.create(
            business=business,
            generated_by=request.user,
            report_type=report_type,
            report_title=payload["title"],
            date_from=date_from,
            date_to=date_to,
            item_count=len(payload.get("items", [])),
        )

    def _report_title(self, report_type):
        return {
            'sales': 'Sales Report',
            'expenses': 'Expenses Report',
            'inventory': 'Inventory Report',
            'profit-loss': 'Profit & Loss Report',
        }[report_type]

    def _report_heading(self, business, report_type):
        return f"{business.name} {self._report_title(report_type)}"

    def _build_sales_report_data(self, request):
        from apps.sales.models import SaleItem

        business = self._get_business(request)
        date_from, date_to = self._parse_dates(request)
        owner_name = request.user.get_full_name() or request.user.username

        sales = SaleItem.objects.filter(business=business).select_related('sale', 'sale__customer', 'sale__branch', 'product').order_by('-sale__sale_date', '-created_at')
        if date_from:
            sales = sales.filter(sale__sale_date__date__gte=date_from)
        if date_to:
            sales = sales.filter(sale__sale_date__date__lte=date_to)

        items = []
        total = 0
        for item in sales:
            sale = item.sale
            customer_name = sale.customer.name if sale.customer else 'Walk-in'
            branch_name = sale.branch.name if sale.branch else 'N/A'
            items.append({
                'id': str(item.id),
                'description': item.product.name,
                'date': sale.sale_date,
                'customer': customer_name,
                'branch': branch_name,
                'payment_method': sale.payment_method,
                'quantity': float(item.quantity),
                'unit_price': float(item.unit_price),
                'amount': float(item.subtotal),
            })
            total += item.subtotal

        return {
            'report_type': 'sales',
            'title': self._report_heading(business, 'sales'),
            'business_name': business.name,
            'owner_name': owner_name,
            'date_from': date_from,
            'date_to': date_to,
            'items': items,
            'total': float(total),
        }

    def _build_sales_report(self, request, track=True):
        payload = self._build_sales_report_data(request)
        if track:
            business = self._get_business(request)
            self._log_report_generation(request, business, 'sales', payload, payload['date_from'], payload['date_to'])
        return Response(payload)

    def _build_expenses_report_data(self, request):
        from apps.expenses.models import Expense

        business = self._get_business(request)
        date_from, date_to = self._parse_dates(request)
        owner_name = request.user.get_full_name() or request.user.username

        expenses = Expense.objects.filter(business=business).select_related('created_by').order_by('-expense_date')
        if date_from:
            expenses = expenses.filter(expense_date__gte=date_from)
        if date_to:
            expenses = expenses.filter(expense_date__lte=date_to)

        items = []
        total = 0
        for expense in expenses:
            description = expense.description or expense.category
            items.append({
                'id': str(expense.id),
                'description': description,
                'category': expense.category,
                'date': expense.expense_date,
                'amount': float(expense.amount),
            })
            total += expense.amount

        return {
            'report_type': 'expenses',
            'title': self._report_heading(business, 'expenses'),
            'business_name': business.name,
            'owner_name': owner_name,
            'date_from': date_from,
            'date_to': date_to,
            'items': items,
            'total': float(total),
        }

    def _build_expenses_report(self, request, track=True):
        payload = self._build_expenses_report_data(request)
        if track:
            business = self._get_business(request)
            self._log_report_generation(request, business, 'expenses', payload, payload['date_from'], payload['date_to'])
        return Response(payload)

    def _build_inventory_report_data(self, request):
        from decimal import Decimal

        from apps.inventory.models import Inventory

        business = self._get_business(request)
        owner_name = request.user.get_full_name() or request.user.username
        Inventory.objects.filter(business=business)
        inventory = Inventory.objects.filter(business=business).select_related('product', 'branch').order_by('product__name', 'branch__name')

        items = []
        total_quantity = Decimal('0')
        total_value = Decimal('0')
        for record in inventory:
            stock_value = record.quantity_available * record.product.selling_price
            items.append({
                'id': str(record.id),
                'description': record.product.name,
                'product_name': record.product.name,
                'branch_name': record.branch.name,
                'unit': record.product.unit,
                'quantity': float(record.quantity_available),
                'reorder_level': float(record.reorder_level),
                'amount': float(stock_value),
            })
            total_quantity += record.quantity_available
            total_value += stock_value

        return {
            'report_type': 'inventory',
            'title': self._report_heading(business, 'inventory'),
            'business_name': business.name,
            'owner_name': owner_name,
            'items': items,
            'total_quantity': float(total_quantity),
            'total_value': float(total_value),
            'total': float(total_value),
        }

    def _build_inventory_report(self, request, track=True):
        payload = self._build_inventory_report_data(request)
        if track:
            business = self._get_business(request)
            self._log_report_generation(request, business, 'inventory', payload, None, None)
        return Response(payload)

    def _build_profit_loss_report_data(self, request):
        from apps.expenses.models import Expense
        from apps.sales.models import Sale

        business = self._get_business(request)
        date_from, date_to = self._parse_dates(request)
        owner_name = request.user.get_full_name() or request.user.username

        sales = Sale.objects.filter(business=business)
        expenses = Expense.objects.filter(business=business)
        if date_from:
            sales = sales.filter(sale_date__date__gte=date_from)
            expenses = expenses.filter(expense_date__gte=date_from)
        if date_to:
            sales = sales.filter(sale_date__date__lte=date_to)
            expenses = expenses.filter(expense_date__lte=date_to)

        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        profit = total_revenue - total_expenses

        return {
            'report_type': 'profit-loss',
            'title': self._report_heading(business, 'profit-loss'),
            'business_name': business.name,
            'owner_name': owner_name,
            'date_from': date_from,
            'date_to': date_to,
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'profit': float(profit),
        }

    def _build_profit_loss_report(self, request, track=True):
        payload = self._build_profit_loss_report_data(request)
        if track:
            business = self._get_business(request)
            self._log_report_generation(request, business, 'profit-loss', payload, payload['date_from'], payload['date_to'])
        return Response(payload)

    @action(detail=False, methods=['get'], url_path='sales')
    def sales(self, request):
        return self._build_sales_report(request)

    @action(detail=False, methods=['get'], url_path='expenses')
    def expenses(self, request):
        return self._build_expenses_report(request)

    @action(detail=False, methods=['get'], url_path='inventory')
    def inventory(self, request):
        return self._build_inventory_report(request)

    @action(detail=False, methods=['get'], url_path='profit-loss')
    def profit_loss(self, request):
        return self._build_profit_loss_report(request)

    def _build_report_data(self, request, report_type):
        if report_type == 'sales':
            return self._build_sales_report_data(request)
        if report_type == 'expenses':
            return self._build_expenses_report_data(request)
        if report_type == 'inventory':
            return self._build_inventory_report_data(request)
        if report_type == 'profit-loss':
            return self._build_profit_loss_report_data(request)
        raise ValidationError({'report_type': 'Unsupported report type.'})

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        business = self._get_business(request)
        reports = ReportGeneration.objects.filter(business=business).select_related('generated_by').order_by('-created_at')

        limit = request.query_params.get('limit')
        if limit:
            try:
                reports = reports[: int(limit)]
            except (TypeError, ValueError):
                pass

        serializer = ReportGenerationSerializer(reports, many=True)
        return Response({
            'count': ReportGeneration.objects.filter(business=business).count(),
            'results': serializer.data,
        })

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        business = self._get_business(request)
        report_counts = ReportGeneration.objects.filter(business=business).values('report_type').annotate(count=Count('id')).order_by('report_type')
        total_reports = ReportGeneration.objects.filter(business=business).count()
        return Response({
            'total_reports': total_reports,
            'report_counts': report_counts,
        })

    def _create_pdf_response(self, report_type, payload):
        buffer = BytesIO()
        document = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
        styles = getSampleStyleSheet()
        body_style = styles['BodyText']
        body_style.fontSize = 8
        body_style.leading = 10

        def wrap_cell(value):
            return Paragraph(str(value), body_style)

        story = [
            Paragraph(payload['title'], styles['Title']),
            Spacer(1, 0.2 * inch),
        ]

        date_from = payload.get('date_from')
        date_to = payload.get('date_to')
        if date_from or date_to:
            story.append(Paragraph(
                f"Period: {date_from or 'All time'} to {date_to or 'All time'}",
                styles['Normal'],
            ))
            story.append(Spacer(1, 0.15 * inch))

        if report_type == 'profit-loss':
            summary = [
                ['Metric', 'Amount'],
                ['Total Revenue', f"{payload['total_revenue']:.2f}"],
                ['Total Expenses', f"{payload['total_expenses']:.2f}"],
                ['Net Profit', f"{payload['profit']:.2f}"],
            ]
            table = Table(summary, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ]))
            story.append(table)
        else:
            if report_type == 'inventory':
                headers = ['Product', 'Branch', 'Quantity', 'Reorder Level', 'Stock Value']
                rows = [[
                    wrap_cell(item['product_name']),
                    wrap_cell(item['branch_name']),
                    f"{item['quantity']:.2f}",
                    f"{item['reorder_level']:.2f}",
                    f"{item['amount']:.2f}",
                ] for item in payload['items']]
            elif report_type == 'expenses':
                headers = ['Date', 'Category', 'Description', 'Amount']
                rows = [[
                    str(item['date']),
                    wrap_cell(item['category']),
                    wrap_cell(item['description']),
                    f"{item['amount']:.2f}",
                ] for item in payload['items']]
            else:
                headers = ['Date', 'Item', 'Customer', 'Branch', 'Qty', 'Unit Price', 'Amount']
                rows = [[
                    str(item['date']),
                    wrap_cell(item['description']),
                    wrap_cell(item['customer']),
                    wrap_cell(item['branch']),
                    f"{item['quantity']:.2f}",
                    f"{item['unit_price']:.2f}",
                    f"{item['amount']:.2f}",
                ] for item in payload['items']]

            table_data = [headers] + rows if rows else [headers, ['No data available'] + [''] * (len(headers) - 1)]
            table = Table(table_data, repeatRows=1, hAlign='LEFT', colWidths=[1.0 * inch, 1.9 * inch, 1.7 * inch, 1.3 * inch, 0.8 * inch, 0.9 * inch, 0.9 * inch] if report_type == 'sales' else None)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('LEADING', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('ALIGN', (4, 1), (-1, -1), 'RIGHT'),
            ]))
            story.append(table)

        document.build(story)
        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{report_type}-report.pdf"'
        return response

    @action(detail=False, methods=['get'], url_path=r'(?P<report_type>sales|expenses|inventory|profit-loss)/export')
    def export(self, request, report_type=None):
        payload = self._build_report_data(request, report_type)
        return self._create_pdf_response(report_type, payload)

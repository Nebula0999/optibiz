from rest_framework import serializers
from django.db import transaction

from apps.inventory.services import get_sale_branch, record_stock_movement
from apps.sales.models import Payment, Sale, SaleItem


class SaleItemReadSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "product", "product_name", "quantity", "unit_price", "subtotal"]


class SaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    items = SaleItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "business",
            "branch",
            "branch_name",
            "customer",
            "customer_name",
            "total_amount",
            "payment_method",
            "sale_date",
            "created_by",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = ["id", "business", "created_by", "sale_date", "created_at", "updated_at"]


class CreateSaleSerializer(serializers.Serializer):
    product = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)
    payment_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices)
    customer = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def validate_product(self, value):
        from apps.products.models import Product
        try:
            return Product.objects.get(pk=value, business=self.context["business"])
        except (Product.DoesNotExist, ValueError):
            raise serializers.ValidationError("Product not found.")

    def validate_customer(self, value):
        if not value:
            return None
        from apps.customers.models import Customer
        try:
            return Customer.objects.get(pk=value, business=self.context["business"])
        except (Customer.DoesNotExist, ValueError):
            raise serializers.ValidationError("Customer not found.")

    @transaction.atomic
    def create(self, validated_data):
        product = validated_data["product"]
        quantity = validated_data["quantity"]
        business = self.context["business"]
        branch = get_sale_branch(business)
        unit_price = product.selling_price
        subtotal = unit_price * quantity
        user = self.context["user"]

        sale = Sale.objects.create(
            business=business,
            branch=branch,
            customer=validated_data.get("customer"),
            payment_method=validated_data["payment_method"],
            total_amount=subtotal,
            created_by=user,
        )
        SaleItem.objects.create(
            business=business,
            sale=sale,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        record_stock_movement(
            business=business,
            product=product,
            movement_type="out",
            quantity=quantity,
            created_by=user,
            notes=f"Sale #{sale.pk}",
            source_branch=branch,
        )
        return sale


class UpdateSaleSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices, required=False)
    customer = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    quantity = serializers.IntegerField(min_value=1, required=False)

    def validate_customer(self, value):
        if not value:
            return None
        from apps.customers.models import Customer
        try:
            return Customer.objects.get(pk=value, business=self.context["business"])
        except (Customer.DoesNotExist, ValueError):
            raise serializers.ValidationError("Customer not found.")

    @transaction.atomic
    def update(self, instance, validated_data):
        branch = instance.branch or get_sale_branch(self.context["business"])
        if "payment_method" in validated_data:
            instance.payment_method = validated_data["payment_method"]
        if "customer" in validated_data:
            instance.customer = validated_data["customer"]

        new_quantity = validated_data.get("quantity")
        if new_quantity is not None:
            item = instance.items.first()
            if item:
                original_quantity = item.quantity
                item.quantity = new_quantity
                item.subtotal = item.unit_price * new_quantity
                item.save(update_fields=["quantity", "subtotal"])
                instance.total_amount = item.subtotal
                inventory_delta = original_quantity - new_quantity
                if inventory_delta:
                    record_stock_movement(
                        business=instance.business,
                        product=item.product,
                        movement_type="in" if inventory_delta > 0 else "out",
                        quantity=abs(inventory_delta),
                        created_by=instance.created_by,
                        notes=f"Sale #{instance.pk} adjustment",
                        source_branch=branch,
                        destination_branch=branch,
                    )

        instance.save()
        return instance


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ["id", "business", "sale", "product", "quantity", "unit_price", "subtotal", "created_at", "updated_at"]
        read_only_fields = ["id", "business", "created_at", "updated_at"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "business", "sale", "amount", "method", "reference_code", "paid_at", "created_at", "updated_at"]
        read_only_fields = ["id", "business", "paid_at", "created_at", "updated_at"]

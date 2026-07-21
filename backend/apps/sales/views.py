from apps.core.views import BusinessScopedModelViewSet
from apps.sales.models import Payment, Sale, SaleItem
from apps.sales.serializers import (
    PaymentSerializer, SaleItemSerializer, SaleSerializer,
    CreateSaleSerializer, UpdateSaleSerializer,
)
from apps.inventory.services import reverse_sale_inventory
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction


class SaleViewSet(BusinessScopedModelViewSet):
    queryset = Sale.objects.select_related(
        "business", "branch", "customer", "created_by"
    ).prefetch_related("items__product").all()
    serializer_class = SaleSerializer

    def create(self, request, *args, **kwargs):
        business = self._get_user_business()
        serializer = CreateSaleSerializer(
            data=request.data,
            context={"business": business, "user": request.user},
        )
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        sale.refresh_from_db()
        # reload with prefetch for response
        sale = Sale.objects.prefetch_related("items__product").select_related(
            "customer", "branch", "created_by", "business"
        ).get(pk=sale.pk)
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        business = self._get_user_business()
        serializer = UpdateSaleSerializer(
            instance,
            data=request.data,
            partial=partial,
            context={"business": business},
        )
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        sale = Sale.objects.prefetch_related("items__product").select_related(
            "customer", "branch", "created_by", "business"
        ).get(pk=sale.pk)
        return Response(SaleSerializer(sale).data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        reverse_sale_inventory(instance)
        return super().destroy(request, *args, **kwargs)


class SaleItemViewSet(BusinessScopedModelViewSet):
    queryset = SaleItem.objects.select_related("business", "sale", "product").all()
    serializer_class = SaleItemSerializer


class PaymentViewSet(BusinessScopedModelViewSet):
    queryset = Payment.objects.select_related("business", "sale").all()
    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        serializer.save(business=self._get_user_business())

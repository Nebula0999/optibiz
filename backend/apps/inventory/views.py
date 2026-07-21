from apps.core.views import BusinessScopedModelViewSet
from apps.inventory.models import Inventory, StockMovement
from apps.inventory.serializers import InventorySerializer, StockMovementSerializer
from apps.inventory.services import ensure_business_inventory


class InventoryViewSet(BusinessScopedModelViewSet):
    queryset = Inventory.objects.select_related("business", "product", "branch").all()
    serializer_class = InventorySerializer

    def list(self, request, *args, **kwargs):
        if getattr(request.user, "business", None):
            ensure_business_inventory(request.user.business)
        return super().list(request, *args, **kwargs)


class StockMovementViewSet(BusinessScopedModelViewSet):
    queryset = StockMovement.objects.select_related("business", "product", "source_branch", "destination_branch", "created_by").all()
    serializer_class = StockMovementSerializer

    def perform_create(self, serializer):
        serializer.save(business=self._get_user_business(), created_by=self.request.user)

from rest_framework import permissions, viewsets

from apps.business.models import Branch, Business, Settings
from apps.business.serializers import BranchSerializer, BusinessSerializer, SettingsSerializer
from apps.core.views import BusinessScopedModelViewSet
from apps.inventory.services import ensure_business_inventory


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return self.queryset
        if getattr(self.request.user, "business_id", None):
            return self.queryset.filter(pk=self.request.user.business_id)
        return self.queryset.none()

    def perform_create(self, serializer):
        business = serializer.save()
        if getattr(self.request.user, "business_id", None) is None:
            self.request.user.business = business
            self.request.user.save(update_fields=["business"])


class BranchViewSet(BusinessScopedModelViewSet):
    queryset = Branch.objects.select_related("business").all()
    serializer_class = BranchSerializer

    def perform_create(self, serializer):
        branch = serializer.save(business=self._get_user_business())
        ensure_business_inventory(branch.business)

class SettingsViewSet(BusinessScopedModelViewSet):
    queryset = Settings.objects.select_related("business_name").all()
    serializer_class = SettingsSerializer

    def get_object(self):
        business = self.request.user.business
        settings, created = Settings.objects.get_or_create(business_name=business)
        return settings
    
    def perform_update(self, serializer):
        instance = self.get_object()
        serializer.save(business_name=instance.business_name)
        
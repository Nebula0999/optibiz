from django.db.models import Count, Sum
from rest_framework.response import Response
from rest_framework import viewsets

from apps.core.views import BusinessScopedModelViewSet
from apps.sacco.models import Contribution, Loan, LoanRepayment, SACCOMember
from apps.sacco.serializers import ContributionSerializer, LoanRepaymentSerializer, LoanSerializer, SACCOMemberSerializer


class SACCOMemberViewSet(BusinessScopedModelViewSet):
    queryset = SACCOMember.objects.select_related("business").all()
    serializer_class = SACCOMemberSerializer


class ContributionViewSet(BusinessScopedModelViewSet):
    queryset = Contribution.objects.select_related("business", "member").all()
    serializer_class = ContributionSerializer


class LoanViewSet(BusinessScopedModelViewSet):
    queryset = Loan.objects.select_related("business", "member").all()
    serializer_class = LoanSerializer


class LoanRepaymentViewSet(BusinessScopedModelViewSet):
    queryset = LoanRepayment.objects.select_related("business", "loan").all()
    serializer_class = LoanRepaymentSerializer

    def perform_create(self, serializer):
        serializer.save(business=self._get_user_business())


class SaccoStatsViewSet(viewsets.ViewSet):
    """Summary values used by the SACCO dashboard."""

    def list(self, request):
        business = getattr(request.user, "business", None)
        if not business:
            return Response({"total_savings": 0, "active_loans": 0, "members_count": 0})

        return Response({
            "total_savings": float(
                Contribution.objects.filter(business=business).aggregate(total=Sum("amount"))["total"] or 0
            ),
            "active_loans": Loan.objects.filter(business=business, status=Loan.Status.ACTIVE).count(),
            "members_count": SACCOMember.objects.filter(business=business).count(),
        })

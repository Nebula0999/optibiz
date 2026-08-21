"""URL configuration for OptiBiz."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.business.views import BranchViewSet, BusinessViewSet, SettingsViewSet
from apps.customers.views import CustomerViewSet
from apps.expenses.views import ExpenseViewSet
from apps.inventory.views import InventoryViewSet, StockMovementViewSet
from apps.products.views import CategoryViewSet, ProductViewSet
from apps.sales.views import PaymentViewSet, SaleItemViewSet, SaleViewSet
from apps.sacco.views import ContributionViewSet, LoanRepaymentViewSet, LoanViewSet, SACCOMemberViewSet, SaccoStatsViewSet
from apps.users.views import RoleViewSet, UserViewSet, CustomTokenObtainPairView
from apps.core.views import DashboardViewSet, ReportViewSet
from apps.notifications.views import NotificationViewSet


router = DefaultRouter()
router.register(r"businesses", BusinessViewSet, basename="business")
router.register(r"branches", BranchViewSet, basename="branch")
router.register(r"businesses/<business_id>/settings", SettingsViewSet, basename="setting")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"users", UserViewSet, basename="user")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"inventory", InventoryViewSet, basename="inventory")
router.register(r"stock-movements", StockMovementViewSet, basename="stockmovement")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"sales", SaleViewSet, basename="sale")
router.register(r"sale-items", SaleItemViewSet, basename="saleitem")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"expenses", ExpenseViewSet, basename="expense")
router.register(r"sacco-members", SACCOMemberViewSet, basename="sacco-member")
router.register(r"sacco-contributions", ContributionViewSet, basename="sacco-contribution")
router.register(r"sacco-loans", LoanViewSet, basename="sacco-loan")
router.register(r"sacco-repayments", LoanRepaymentViewSet, basename="sacco-repayment")
router.register(r"sacco-stats", SaccoStatsViewSet, basename="sacco-stats")
router.register(r"dashboard", DashboardViewSet, basename="dashboard")
router.register(r"reports", ReportViewSet, basename="report")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("health/", lambda request: JsonResponse({"status": "ok"}), name="health"),
    path("admin/", admin.site.urls),
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
]

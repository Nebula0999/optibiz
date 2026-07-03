import { useDashboardStats, useRecentSales, useLowStockAlerts } from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DataTable } from '@/components/ui/Table';



export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sales, isLoading: salesLoading } = useRecentSales();
  const { data: alerts } = useLowStockAlerts();

  if (statsLoading) {
    return (
      <MainLayout>
        <LoadingSpinner size="lg" />
      </MainLayout>
    );
  }

  const dashboardStats = stats?.data || {
    total_revenue: 0,
    total_expenses: 0,
    profit: 0,
    low_stock_items: 0,
    active_customers: 0,
  };

  const recentSales = sales?.data?.results || [];
  const lowStockAlerts = alerts?.data?.results || [];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Customer' },
    { key: 'total_amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'payment_method', label: 'Method' },
    { key: 'sale_date', label: 'Date', render: (val) => formatDate(val) },
  ];

  const StatCard = ({ label, value, trend, icon: Icon }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' ? formatCurrency(value) : value}
            </p>
            {trend && (
              <p className="text-xs text-gray-500 mt-2">
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
              </p>
            )}
          </div>
          {Icon && <Icon className="text-primary-600" size={24} />}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Revenue"
          value={dashboardStats.total_revenue}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Expenses"
          value={dashboardStats.total_expenses}
          icon={TrendingDown}
        />
        <StatCard
          label="Profit"
          value={dashboardStats.profit}
          icon={TrendingUp}
        />
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {dashboardStats.active_customers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex justify-between items-start pb-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {alert.product_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {alert.current_stock || alert.quantity_available} units left
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      Low
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                All stock levels are good!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <LoadingSpinner />
            ) : recentSales.length > 0 ? (
              <DataTable columns={columns} data={recentSales} />
            ) : (
              <p className="text-gray-500 text-center py-8">
                No sales yet. Start recording sales to see them here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

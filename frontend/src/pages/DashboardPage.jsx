import {
  useDashboardStats,
  useRecentSales,
  useLowStockAlerts,
  useDashboardAnalytics,
} from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DataTable } from '@/components/ui/Table';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';



export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sales, isLoading: salesLoading } = useRecentSales();
  const { data: alerts } = useLowStockAlerts();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();

  if (statsLoading || analyticsLoading) {
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

  const dashboardAnalytics = analytics?.data || {
    profit_loss_trend: [],
    stock_health: [],
    stock_levels: [],
    stock_summary: {
      total_items: 0,
      healthy_items: 0,
      low_stock_items: 0,
      out_of_stock_items: 0,
      total_units: 0,
      total_value: 0,
    },
  };

  const recentSales = sales?.data?.results || [];
  const lowStockAlerts = alerts?.data?.results || [];
  const profitLossTrend = dashboardAnalytics.profit_loss_trend || [];
  const stockHealth = dashboardAnalytics.stock_health || [];
  const stockLevels = dashboardAnalytics.stock_levels || [];
  const stockSummary = dashboardAnalytics.stock_summary || {};

  const stockHealthColors = {
    Healthy: '#16a34a',
    'Low stock': '#f59e0b',
    'Out of stock': '#ef4444',
  };

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

  const chartTooltipFormatter = (value) => formatCurrency(Number(value || 0));

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here&apos;s your business overview.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profit and Loss Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {profitLossTrend.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitLossTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `KES ${Number(value).toLocaleString()}`} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip formatter={chartTooltipFormatter} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={false} name="Expenses" />
                    <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} dot={false} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">
                Add sales and expenses to see profit and loss trends.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Health</CardTitle>
          </CardHeader>
          <CardContent>
            {stockHealth.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockHealth}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {stockHealth.map((entry) => (
                        <Cell key={entry.name} fill={entry.color || stockHealthColors[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} items`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-700">Healthy</p>
                    <p className="text-lg font-semibold text-green-900">{stockSummary.healthy_items || 0}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">Low</p>
                    <p className="text-lg font-semibold text-amber-900">{stockSummary.low_stock_items || 0}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-red-700">Out</p>
                    <p className="text-lg font-semibold text-red-900">{stockSummary.out_of_stock_items || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">
                Stock health will appear once inventory is recorded.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Stock Levels vs Reorder Level</CardTitle>
        </CardHeader>
        <CardContent>
          {stockLevels.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="product_name" tick={{ fill: '#6b7280', fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                  <Legend />
                  <Bar dataKey="current_stock" name="Current stock" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="reorder_level" name="Reorder level" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">
              Record inventory items to compare stock levels against reorder thresholds.
            </p>
          )}
        </CardContent>
      </Card>

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

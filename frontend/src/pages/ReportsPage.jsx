import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart3, Download } from 'lucide-react';
import { reportsAPI } from '@/lib/api';
import { useReportHistory, useReportSummary } from '@/hooks';

export function ReportsPage() {
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { data: reportHistoryData, isLoading: isHistoryLoading } = useReportHistory({ limit: 10 });
  const { data: reportSummaryData, isLoading: isSummaryLoading } = useReportSummary();

  const reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'expenses', label: 'Expenses Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'profit-loss', label: 'Profit & Loss Report' },
  ];

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      let response;
      if (reportType === 'sales') {
        response = await reportsAPI.getSales(params);
      } else if (reportType === 'expenses') {
        response = await reportsAPI.getExpenses(params);
      } else if (reportType === 'inventory') {
        response = await reportsAPI.getInventory(params);
      } else if (reportType === 'profit-loss') {
        response = await reportsAPI.getProfitLoss(params);
      }

      setReportData(response.data);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    } catch (error) {
      alert('Error generating report: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await reportsAPI.generatePDF(reportType, params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting PDF: ' + error.message);
    }
  };

  const reportTitle = reportTypes.find((r) => r.value === reportType)?.label || 'Report';
  const reportHeading = reportData?.title || reportTitle;
  const reportHistory = reportHistoryData?.data?.results || reportHistoryData?.results || [];
  const reportSummary = reportSummaryData?.data || reportSummaryData || {};

  const summaryCounts = new Map((reportSummary.report_counts || []).map((item) => [item.report_type, item.count]));
  const summaryCards = [
    { key: 'total', label: 'Total Reports', value: reportSummary.total_reports ?? 0 },
    { key: 'sales', label: 'Sales', value: summaryCounts.get('sales') ?? 0 },
    { key: 'expenses', label: 'Expenses', value: summaryCounts.get('expenses') ?? 0 },
    { key: 'inventory', label: 'Inventory', value: summaryCounts.get('inventory') ?? 0 },
    { key: 'profit-loss', label: 'Profit & Loss', value: summaryCounts.get('profit-loss') ?? 0 },
  ];

  const formatPeriod = (item) => item.period_label || 'All time';

  const renderReportBody = () => {
    if (!reportData) return null;

    if (reportType === 'profit-loss') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.total_revenue)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.total_expenses)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.profit)}</p>
          </div>
        </div>
      );
    }

    if (reportType === 'inventory') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Product</th>
                <th className="px-4 py-2 text-left font-semibold">Branch</th>
                <th className="px-4 py-2 text-right font-semibold">Quantity</th>
                <th className="px-4 py-2 text-right font-semibold">Reorder Level</th>
                <th className="px-4 py-2 text-right font-semibold">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {reportData.items?.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.product_name}</td>
                  <td className="px-4 py-2">{item.branch_name}</td>
                  <td className="px-4 py-2 text-right">{Number(item.quantity).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{Number(item.reorder_level).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-2" colSpan="4">Total Stock Value</td>
                <td className="px-4 py-2 text-right">{formatCurrency(reportData.total_value)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Date</th>
              <th className="px-4 py-2 text-left font-semibold">Item</th>
              <th className="px-4 py-2 text-left font-semibold">
                {reportType === 'sales' ? 'Customer' : 'Category'}
              </th>
              {reportType === 'sales' && <th className="px-4 py-2 text-left font-semibold">Branch</th>}
              {reportType === 'sales' && <th className="px-4 py-2 text-left font-semibold">Payment</th>}
              <th className="px-4 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {reportData.items?.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{formatDate(item.date)}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2">{reportType === 'sales' ? item.customer : item.category}</td>
                {reportType === 'sales' && <td className="px-4 py-2">{item.branch}</td>}
                {reportType === 'sales' && <td className="px-4 py-2">{item.payment_method}</td>}
                <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-4 py-2" colSpan={reportType === 'sales' ? 5 : 3}>Total</td>
              <td className="px-4 py-2 text-right">{formatCurrency(reportData.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate financial and operational reports</p>
      </div>

      {/* Report Generator */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              options={reportTypes}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />

            <Input
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <div className="flex items-end gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 size={18} />
                    Generate
                  </>
                )}
              </Button>

              {reportData && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleExportPDF}
                  className="flex items-center gap-2"
                >
                  <Download size={18} />
                  PDF
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>{reportHeading}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderReportBody()}
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Report Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {summaryCards.map((card) => (
              <div key={card.key} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isSummaryLoading ? '...' : card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Report</th>
                  <th className="px-4 py-2 text-left font-semibold">Period</th>
                  <th className="px-4 py-2 text-left font-semibold">Generated By</th>
                  <th className="px-4 py-2 text-left font-semibold">Generated At</th>
                  <th className="px-4 py-2 text-right font-semibold">Items</th>
                </tr>
              </thead>
              <tbody>
                {isHistoryLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-gray-500" colSpan="5">
                      Loading report history...
                    </td>
                  </tr>
                ) : reportHistory.length > 0 ? (
                  reportHistory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{item.report_title}</td>
                      <td className="px-4 py-2">{formatPeriod(item)}</td>
                      <td className="px-4 py-2">{item.generated_by_name || 'Unknown'}</td>
                      <td className="px-4 py-2">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-2 text-right">{item.item_count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-center text-gray-500" colSpan="5">
                      No reports generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!reportData && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select report type and click generate to view data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}

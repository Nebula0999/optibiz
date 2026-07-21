import { useState } from 'react';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale, useProducts, useCustomers } from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/Loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function getList(data) {
  const payload = data?.data || data;
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

const EMPTY_FORM = {
  product: '',
  quantity: '1',
  payment_method: 'cash',
  customer: '',
};

export function SalesPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSale, setEditingSale] = useState(null); // sale object being edited
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ payment_method: 'cash', customer: '', quantity: '1' });

  const { data: salesData, isLoading } = useSales();
  const { data: productsData } = useProducts();
  const { data: customersData } = useCustomers();
  const createSaleMutation = useCreateSale();
  const updateSaleMutation = useUpdateSale();
  const deleteSaleMutation = useDeleteSale();

  const sales = getList(salesData);
  const products = getList(productsData);
  const customers = getList(customersData);

  const handleAddSale = async (e) => {
    e.preventDefault();
    if (!formData.product || !formData.quantity) {
      alert('Please select a product and quantity');
      return;
    }
    try {
      await createSaleMutation.mutateAsync({
        product: formData.product,
        quantity: parseInt(formData.quantity, 10),
        payment_method: formData.payment_method,
        customer: formData.customer || null,
      });
      setIsAdding(false);
      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error('Error creating sale:', error);
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : 'Failed to record sale. Please try again.';
      alert(msg);
    }
  };

  const openEdit = (sale) => {
    setEditingSale(sale);
    const item = sale.items?.[0];
    setEditForm({
      payment_method: sale.payment_method,
      customer: sale.customer ?? '',
      quantity: item ? String(item.quantity) : '1',
    });
  };

  const handleEditSale = async (e) => {
    e.preventDefault();
    try {
      await updateSaleMutation.mutateAsync({
        id: editingSale.id,
        data: {
          payment_method: editForm.payment_method,
          customer: editForm.customer || null,
          quantity: parseInt(editForm.quantity, 10),
        },
      });
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale:', error);
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : 'Failed to update sale. Please try again.';
      alert(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSaleMutation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting sale:', error);
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : 'Failed to delete sale. Please try again.';
      alert(msg);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'items',
      label: 'Product',
      render: (items) => items?.[0]?.product_name ?? '—',
    },
    {
      key: 'items',
      label: 'Qty',
      render: (items) => items?.[0]?.quantity ?? '—',
    },
    {
      key: 'items',
      label: 'Unit Price',
      render: (items) => items?.[0] ? formatCurrency(items[0].unit_price) : '—',
    },
    { key: 'total_amount', label: 'Total', render: (val) => formatCurrency(val) },
    { key: 'payment_method', label: 'Method' },
    { key: 'sale_date', label: 'Date', render: (val) => formatDate(val) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeletingId(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Record and manage your sales</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          New Sale
        </Button>
      </div>

      {/* Add Sale Form */}
      {isAdding && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record New Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSale} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Product"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                required
              />
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <Select
                label="Customer (Optional)"
                options={[
                  { value: '', label: 'Walk-in Customer' },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
              <Select
                label="Payment Method"
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'mpesa', label: 'M-Pesa' },
                  { value: 'card', label: 'Card' },
                  { value: 'bank', label: 'Bank Transfer' },
                ]}
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" variant="primary" disabled={createSaleMutation.isPending}>
                  {createSaleMutation.isPending ? 'Recording...' : 'Record Sale'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Sale #{editingSale.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSale} className="grid grid-cols-1 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  required
                />
                <Select
                  label="Customer"
                  options={[
                    { value: '', label: 'Walk-in Customer' },
                    ...customers.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  value={editForm.customer}
                  onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                />
                <Select
                  label="Payment Method"
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'mpesa', label: 'M-Pesa' },
                    { value: 'card', label: 'Card' },
                    { value: 'bank', label: 'Bank Transfer' },
                  ]}
                  value={editForm.payment_method}
                  onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" disabled={updateSaleMutation.isPending}>
                    {updateSaleMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingSale(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">Are you sure you want to delete sale #{deletingId}? This cannot be undone.</p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleteSaleMutation.isPending}
                >
                  {deleteSaleMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
                <Button variant="outline" onClick={() => setDeletingId(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : sales.length > 0 ? (
            <DataTable columns={columns} data={sales} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              No sales recorded yet. Create your first sale!
            </p>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}

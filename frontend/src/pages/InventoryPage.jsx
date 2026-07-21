import { useMemo, useState } from 'react';
import { useInventory, useLowStockAlerts, useProducts, useCreateStockMovement } from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

function getList(data) {
  const payload = data?.data || data;
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

export function InventoryPage() {
  const [movementForm, setMovementForm] = useState({ product: '', quantity: '', notes: '' });
  const { data: inventoryData, isLoading } = useInventory();
  const { data: alertsData } = useLowStockAlerts();
  const { data: productsData } = useProducts();
  const createMovementMutation = useCreateStockMovement();

  const inventory = getList(inventoryData);
  const alerts = getList(alertsData);
  const products = getList(productsData);
  const productOptions = useMemo(
    () => [
      { value: '', label: products.length ? 'Select a product' : 'No products available' },
      ...products.map((product) => ({ value: product.id, label: product.name })),
    ],
    [products]
  );

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!movementForm.product || !movementForm.quantity) {
      alert('Please select a product and quantity');
      return;
    }

    try {
      await createMovementMutation.mutateAsync({
        product: movementForm.product,
        movement_type: 'in',
        quantity: Number(movementForm.quantity),
        notes: movementForm.notes,
      });
      setMovementForm({ product: '', quantity: '', notes: '' });
    } catch (error) {
      console.error('Error adding stock:', error);
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to add stock. Please try again.';
      alert(msg);
    }
  };

  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'current_stock', label: 'Stock' },
    { key: 'reorder_level', label: 'Min Level' },
    {
      key: 'current_stock',
      label: 'Status',
      render: (quantity, row) => {
        const isLow = Number(quantity) <= Number(row.reorder_level);
        return (
          <Badge variant={isLow ? 'warning' : 'success'} size="sm">
            {isLow ? 'Low Stock' : 'In Stock'}
          </Badge>
        );
      },
    },
    { key: 'product_buying_price', label: 'Cost', render: (val) => formatCurrency(val) },
    { key: 'product_unit', label: 'Unit' },
  ];

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">Monitor your stock levels and add stock when needed</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Product"
              options={productOptions}
              value={movementForm.product}
              onChange={(e) => setMovementForm({ ...movementForm, product: e.target.value })}
              required
              disabled={products.length === 0}
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              step="1"
              value={movementForm.quantity}
              onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
              required
            />
            <Input
              label="Notes"
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" variant="primary" disabled={createMovementMutation.isPending || products.length === 0}>
                {createMovementMutation.isPending ? 'Adding Stock...' : 'Add Quantity'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-yellow-900 mb-4">
              ⚠️ {alerts.length} products have low stock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{alert.product_name}</p>
                  <p className="text-sm text-gray-600">
                    {alert.current_stock} / {alert.reorder_level} units
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : inventory.length > 0 ? (
            <DataTable columns={columns} data={inventory} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              No inventory data. Add products first!
            </p>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}

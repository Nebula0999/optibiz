import { useState } from 'react';
import { useProducts, useCreateProduct, useDeleteProduct, useCategories } from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

function getList(data) {
  const payload = data?.data || data;
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

export function ProductsPage() {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    buying_price: '',
    selling_price: '',
    reorder_level: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: productsData, isLoading } = useProducts({
    search: searchTerm,
  });
  
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  const products = getList(productsData);
  const categories = getList(categoriesData);
  const categoryOptions = [
    {
      value: '',
      label: categoriesLoading ? 'Loading categories...' : 'Select a category',
    },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.category || !formData.selling_price) {
      alert('Please fill all required fields');
      return;
    }

    const payload = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData.selling_price),
      reorder_level: parseInt(formData.reorder_level, 10) || 10,
    };

    createProductMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          name: '',
          sku: '',
          category: '',
          buying_price: '',
          selling_price: '',
          reorder_level: '',
        });
        setIsAddingProduct(false);
      },
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const columns = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category_name', label: 'Category' },
    { key: 'buying_price', label: 'Cost', render: (val) => formatCurrency(val) },
    { key: 'selling_price', label: 'Price', render: (val) => formatCurrency(val) },
    {
      key: 'id',
      label: 'Actions',
      render: (val) => (
        <button
          onClick={() => handleDelete(val)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 size={18} />
        </button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalogue</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Add Product
        </Button>
      </div>

      {/* Add Product Form */}
      {isAddingProduct && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                placeholder="e.g., Rice 50kg"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <Input
                label="SKU"
                placeholder="e.g., RICE-50KG"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                required
              />

              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                disabled={categoriesLoading || categories.length === 0}
                required
              />

              {categoriesError && (
                <p className="text-sm text-red-600 md:col-span-2">
                  Could not load categories. Please refresh and try again.
                </p>
              )}

              {!categoriesLoading && !categoriesError && categories.length === 0 && (
                <p className="text-sm text-gray-500 md:col-span-2">
                  No categories found. Add a category first, then create products.
                </p>
              )}

              <Input
                label="Buying Price"
                type="number"
                placeholder="Cost price"
                value={formData.buying_price}
                onChange={(e) =>
                  setFormData({ ...formData, buying_price: e.target.value })
                }
              />

              <Input
                label="Selling Price"
                type="number"
                placeholder="Sale price"
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
                required
              />

              <Input
                label="Reorder Level"
                type="number"
                placeholder="Alert when stock falls below"
                value={formData.reorder_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorder_level: e.target.value,
                  })
                }
              />

              <div className="md:col-span-2 flex gap-2">
                {createProductMutation.isError && (
                  <p className="text-sm text-red-600 self-center">
                    {createProductMutation.error?.response?.data?.detail ||
                      'Could not add product. Check the fields and try again.'}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    createProductMutation.isPending ||
                    categoriesLoading ||
                    categories.length === 0
                  }
                >
                  {createProductMutation.isPending ? 'Adding...' : 'Add Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingProduct(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : products.length > 0 ? (
            <DataTable columns={columns} data={products} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              No products yet. Add your first product to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
import { useState } from 'react';
import { useDeleteExpense, useExpenses, useCreateExpense, useUpdateExpense } from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/Loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: '', label: 'Select category' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
];

const getTodayDate = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export function ExpensesPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    expense_date: getTodayDate(),
  });

  const { data: expensesData, isLoading } = useExpenses();
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const expenses = expensesData?.data?.results || expensesData?.data || [];

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      description: '',
      expense_date: getTodayDate(),
    });
    setEditingExpenseId(null);
    setIsAdding(false);
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setFormData({
      category: expense.category || '',
      amount: String(expense.amount ?? ''),
      description: expense.description || '',
      expense_date: expense.expense_date ? String(expense.expense_date).slice(0, 10) : getTodayDate(),
    });
    setIsAdding(true);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.amount || !formData.expense_date) {
      alert('Please fill all required fields');
      return;
    }

    const payload = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      expense_date: formData.expense_date,
    };

    const mutation = editingExpenseId ? updateExpenseMutation : createExpenseMutation;
    const variables = editingExpenseId ? { id: editingExpenseId, data: payload } : payload;

    mutation.mutate(variables, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  const handleDeleteExpense = (expense) => {
    const confirmed = window.confirm(`Delete the expense for ${expense.category}?`);
    if (!confirmed) return;

    deleteExpenseMutation.mutate(expense.id, {
      onSuccess: () => {
        if (editingExpenseId === expense.id) {
          resetForm();
        }
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'description', label: 'Description' },
    { key: 'expense_date', label: 'Date', render: (val) => formatDate(val) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleEditExpense(row)}
            className="inline-flex items-center gap-1"
          >
            <Pencil size={14} />
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => handleDeleteExpense(row)}
            disabled={deleteExpenseMutation.isPending}
            className="inline-flex items-center gap-1"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track your business expenses</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            if (isAdding) {
              resetForm();
              return;
            }
            setIsAdding(true);
          }}
          className="flex items-center gap-2"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Close Form' : 'Add Expense'}
        </Button>
      </div>

      {/* Add Expense Form */}
      {isAdding && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingExpenseId ? 'Edit Expense' : 'Record New Expense'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                options={EXPENSE_CATEGORIES}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />

              <Input
                label="Expense Date"
                type="date"
                value={formData.expense_date}
                onChange={(e) =>
                  setFormData({ ...formData, expense_date: e.target.value })
                }
                required
              />

              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Description (Optional)"
                  placeholder="Details about this expense"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                >
                  {editingExpenseId
                    ? updateExpenseMutation.isPending
                      ? 'Saving...'
                      : 'Save Changes'
                    : createExpenseMutation.isPending
                      ? 'Adding...'
                      : 'Add Expense'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : expenses.length > 0 ? (
            <DataTable columns={columns} data={expenses} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              No expenses recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}

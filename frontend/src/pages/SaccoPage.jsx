import { useState } from 'react';
import {
  useSaccoMembers,
  useCreateSaccoMember,
  useSaccoContributions,
  useRecordContribution,
  useSaccoLoans,
  useCreateSaccoLoan,
  useSaccoStats,
} from '@/hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/Loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Plus } from 'lucide-react';

export function SaccoPage() {
  const [tab, setTab] = useState('members'); // members, contributions, loans
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    member_id: '',
    amount: '',
    status: 'active',
  });

  const { data: membersData } = useSaccoMembers();
  const { data: contributionsData } = useSaccoContributions();
  const { data: loansData } = useSaccoLoans();
  const { data: statsData } = useSaccoStats();

  const createMemberMutation = useCreateSaccoMember();
  const recordContributionMutation = useRecordContribution();
  const createLoanMutation = useCreateSaccoLoan();

  const members = membersData?.data?.results || membersData?.data || [];
  const contributions = contributionsData?.data?.results || contributionsData?.data || [];
  const loans = loansData?.data?.results || loansData?.data || [];
  const stats = statsData?.data || { total_savings: 0, active_loans: 0, members_count: 0 };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Name is required');
      return;
    }
    createMemberMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ name: '', phone: '', email: '', member_id: '', amount: '', status: 'active' });
        setIsAdding(false);
      },
    });
  };

  const handleRecordContribution = async (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) {
      alert('Please select member and amount');
      return;
    }
    recordContributionMutation.mutate(
      { member: formData.member_id, amount: formData.amount },
      {
        onSuccess: () => {
          setFormData({ name: '', phone: '', email: '', member_id: '', amount: '', status: 'active' });
          setIsAdding(false);
        },
      }
    );
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) {
      alert('Please select member and loan amount');
      return;
    }
    createLoanMutation.mutate(
      { member: formData.member_id, amount: formData.amount },
      {
        onSuccess: () => {
          setFormData({ name: '', phone: '', email: '', member_id: '', amount: '', status: 'active' });
          setIsAdding(false);
        },
      }
    );
  };

  const memberColumns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'join_date', label: 'Joined', render: (val) => formatDate(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'danger'} size="sm">
          {val}
        </Badge>
      ),
    },
  ];

  const contributionColumns = [
    { key: 'member_name', label: 'Member' },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
  ];

  const loanColumns = [
    { key: 'member_name', label: 'Member' },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'disbursement_date', label: 'Disbursed', render: (val) => formatDate(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge
          variant={val === 'active' ? 'info' : 'success'}
          size="sm"
        >
          {val}
        </Badge>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SACCO Management</h1>
        <p className="text-gray-600">Manage cooperative savings and loans</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Savings</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.total_savings)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Loans</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active_loans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Members</p>
            <p className="text-2xl font-bold text-gray-900">{stats.members_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {[
          { id: 'members', label: 'Members' },
          { id: 'contributions', label: 'Contributions' },
          { id: 'loans', label: 'Loans' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'members' && (
          <>
            <div className="mb-6 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                Add Member
              </Button>
            </div>

            {isAdding && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Add Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                    <div className="flex gap-2 md:col-span-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={createMemberMutation.isPending}
                      >
                        {createMemberMutation.isPending
                          ? 'Adding...'
                          : 'Add Member'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAdding(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <DataTable columns={memberColumns} data={members} />
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'contributions' && (
          <>
            <div className="mb-6 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                Record Contribution
              </Button>
            </div>

            {isAdding && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Record Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleRecordContribution}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <Select
                      label="Member"
                      options={members.map((m) => ({
                        value: m.id,
                        label: m.name,
                      }))}
                      value={formData.member_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          member_id: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      label="Amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={recordContributionMutation.isPending}
                      >
                        {recordContributionMutation.isPending
                          ? 'Recording...'
                          : 'Record'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAdding(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <DataTable columns={contributionColumns} data={contributions} />
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'loans' && (
          <>
            <div className="mb-6 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                New Loan
              </Button>
            </div>

            {isAdding && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Create Loan</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleCreateLoan}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <Select
                      label="Member"
                      options={members.map((m) => ({
                        value: m.id,
                        label: m.name,
                      }))}
                      value={formData.member_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          member_id: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      label="Loan Amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={createLoanMutation.isPending}
                      >
                        {createLoanMutation.isPending
                          ? 'Creating...'
                          : 'Create Loan'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAdding(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <DataTable columns={loanColumns} data={loans} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}

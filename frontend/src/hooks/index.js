import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: api.authAPI.login,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: api.authAPI.register,
  });
}

// Business hooks
export function useCurrentBusiness() {
  return useQuery({
    queryKey: ['business', 'me'],
    queryFn: api.businessAPI.getMe,
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.businessAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'me'] });
    },
  });
}

export function useUpdateBusiness(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.businessAPI.updateBusiness(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'me'] });
    },
  });
}

// Products hooks
export function useProducts(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.productsAPI.list(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.productsAPI.get(id),
    enabled: !!id && !!localStorage.getItem('access_token'),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.productsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateProduct(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.productsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.productsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.productsAPI.listCategories,
    enabled: !!localStorage.getItem('access_token'),
  });
}

// Sales hooks
export function useSales(params = {}) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => api.salesAPI.list(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useSale(id) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => api.salesAPI.get(id),
    enabled: !!id && !!localStorage.getItem('access_token'),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.salesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.salesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.salesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Expenses hooks
export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => api.expensesAPI.list(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.expensesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Inventory hooks
export function useInventory(params = {}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => api.inventoryAPI.list(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.inventoryAPI.createMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Customers hooks
export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => api.customersAPI.list(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.customersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Dashboard hooks
export function useDashboardStats(params = {}) {
  return useQuery({
    queryKey: ['dashboard', 'stats', params],
    queryFn: () => api.dashboardAPI.getStats(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useRecentSales(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recentSales', limit],
    queryFn: () => api.dashboardAPI.getRecentSales(limit),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'lowStockAlerts'],
    queryFn: api.dashboardAPI.getLowStockAlerts,
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useDashboardAnalytics(params = {}) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', params],
    queryFn: () => api.dashboardAPI.getAnalytics(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

// Reports hooks
export function useReportHistory(params = {}) {
  return useQuery({
    queryKey: ['reports', 'history', params],
    queryFn: () => api.reportsAPI.getHistory(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useReportSummary(params = {}) {
  return useQuery({
    queryKey: ['reports', 'summary', params],
    queryFn: () => api.reportsAPI.getSummary(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

// SACCO hooks
export function useSaccoMembers(params = {}) {
  return useQuery({
    queryKey: ['sacco', 'members', params],
    queryFn: () => api.saccoAPI.getMembers(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useCreateSaccoMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saccoAPI.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco', 'members'] });
      queryClient.invalidateQueries({ queryKey: ['sacco', 'stats'] });
    },
  });
}

export function useSaccoContributions(params = {}) {
  return useQuery({
    queryKey: ['sacco', 'contributions', params],
    queryFn: () => api.saccoAPI.getContributions(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useRecordContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saccoAPI.recordContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco', 'contributions'] });
      queryClient.invalidateQueries({ queryKey: ['sacco', 'stats'] });
    },
  });
}

export function useSaccoLoans(params = {}) {
  return useQuery({
    queryKey: ['sacco', 'loans', params],
    queryFn: () => api.saccoAPI.getLoans(params),
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useCreateSaccoLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saccoAPI.createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco', 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['sacco', 'stats'] });
    },
  });
}

export function useSaccoStats() {
  return useQuery({
    queryKey: ['sacco', 'stats'],
    queryFn: api.saccoAPI.getStats,
    enabled: !!localStorage.getItem('access_token'),
  });
}

// Notifications hooks
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notificationsAPI.list({ limit: 10 }),
    enabled: !!localStorage.getItem('access_token'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

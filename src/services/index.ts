import api from '@/lib/api';
import type { AuthResponse, Product, Supplier, Movement, Alert, Inventory, Log, User } from '@/types';

export const authService = {
  login: (matricula: string, senha: string) =>
    api.post<AuthResponse>('/auth', { matricula, senha }).then((r) => r.data),
};

export const productsService = {
  findAll: (search?: string) =>
    api.get<Product[]>('/products', { params: search ? { search } : {} }).then((r) => r.data),
  findOne: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  getStats: () => api.get<{ total: number; alertas: number; totalMovimentos: number }>('/products/stats').then((r) => r.data),
  create: (data: Partial<Product> & { clienteId?: string; modelo?: string }) =>
    api.post<Product>('/products', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch<Product>(`/products/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.patch(`/products/${id}`, { _action: 'deactivate' }).then((r) => r.data),
  transferToNG: (id: string, quantidade: number, observacao?: string) => 
    api.patch(`/products/${id}`, { _action: 'transfer_ng', quantidade, observacao }).then((r) => r.data),
};

export const suppliersService = {
  findAll: (search?: string) => api.get<Supplier[]>('/suppliers', { params: search ? { search } : {} }).then((r) => r.data),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data).then((r) => r.data),
  update: (id: string, data: Partial<Supplier>) => api.patch<Supplier>(`/suppliers/${id}`, data).then((r) => r.data),
};

export const movementsService = {
  findAll: (params?: any) => api.get<Movement[]>('/movements', { params }).then((r) => r.data),
  getResumoHoje: () =>
    api.get<{ entradas: number; saidas: number; total: number }>('/movements/resumo-hoje').then((r) => r.data),
  create: (data: any) => api.post<Movement>('/movements', data).then((r) => r.data),
};

export const alertsService = {
  findAll: (status?: string) =>
    api.get<Alert[]>('/alerts', { params: status ? { status } : {} }).then((r) => r.data),
  getResumo: () =>
    api.get<{ ativos: number; resolvidos: number; total: number }>('/alerts/resumo').then((r) => r.data),
};

export const inventoryService = {
  findAll: () => api.get<Inventory[]>('/inventory').then((r) => r.data),
  getAtivo: () => api.get<Inventory | null>('/inventory', { params: { tipo: 'ativo' } }).then((r) => r.data),
  getHistorico: () => api.get<Inventory[]>('/inventory', { params: { tipo: 'historico' } }).then((r) => r.data),
  findOne: (id: string) => api.get<Inventory>(`/inventory/${id}`).then((r) => r.data),
  iniciar: (data: { responsavel: string; matricula: string }) =>
    api.post<Inventory>('/inventory', data).then((r) => r.data),
  atualizarItem: (inventoryId: string, itemId: string, data: any) =>
    api.patch(`/inventory/${inventoryId}/item/${itemId}`, data).then((r) => r.data),
  finalizar: (id: string, items: any[]) =>
    api.patch<Inventory>(`/inventory/${id}/finalizar`, { items }).then((r) => r.data),
  sync: (id: string) =>
    api.patch<{ message: string; added: number }>(`/inventory/${id}/sync`, {}).then((r) => r.data),
};


export const logsService = {
  findAll: (params?: any) => api.get<Log[]>('/logs', { params }).then((r) => r.data),
};

export const usersService = {
  findAll: () => api.get<User[]>('/users').then((r) => r.data),
  create: (data: any) => api.post<User>('/users', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.patch(`/users/${id}/deactivate`, {}).then((r) => r.data),
};

export const reportsService = {
  pdfInventario: (id: string) =>
    api.get(`/reports/pdf/inventario/${id}`, { responseType: 'blob' }).then((r) => r.data),
  pdfMovimentos: (startDate: string, endDate: string) =>
    api.get('/reports/pdf/movimentos', { params: { startDate, endDate }, responseType: 'blob' }).then((r) => r.data),
  excelInventario: (id: string) =>
    api.get(`/reports/excel/inventarios/${id}`, { responseType: 'blob' }).then((r) => r.data),
  excelInventarios: () =>
    api.get('/reports/excel/inventarios', { responseType: 'blob' }).then((r) => r.data),
  excelEstoqueNissan: () =>
    api.get('/reports/excel/estoque-nissan', { responseType: 'blob' }).then((r) => r.data),
  excelEstoque: () =>
    api.get('/reports/excel/estoque', { responseType: 'blob' }).then((r) => r.data),
  excelEstoqueNG: () =>
    api.get('/reports/excel/estoque-ng', { responseType: 'blob' }).then((r) => r.data),
  download: (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};

export const clientesService = {
  findAll: () => api.get<any[]>('/clientes').then((r) => r.data),
  create: (data: any) => api.post<any>('/clientes', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch<any>(`/clientes/${id}`, data).then((r) => r.data),
};

export const nfService = {
  findAll: (params?: { clienteId?: string; status?: string }) =>
    api.get<any[]>('/nf', { params }).then((r) => r.data),
  findOne: (id: string) => api.get<any>(`/nf/${id}`).then((r) => r.data),
  create: (data: {
    numero: string;
    clienteId: string;
    observacao?: string;
    items: { productId: string; quantidade: number; observacao?: string }[];
  }) => api.post<any>('/nf', data).then((r) => r.data),
  baixar: (id: string, items?: { nfItemId: string; quantidadeBaixar: number }[]) =>
    api.patch<any>(`/nf/${id}/baixar`, { items }).then((r) => r.data),
};
export const dashboardService = {
  getStats: () => api.get<{ 
    weeklyData: { sem: string; entradas: number; saidas: number; label: string }[];
    distribution: { name: string; value: number }[];
    health: { total: number; critical: number; ok: number };
  }>('/stats/dashboard').then((r) => r.data),
};

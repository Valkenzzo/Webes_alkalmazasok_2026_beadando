import type { AuthUser, Budget, Category, CategorySuggestion, FinanceData, PendingProposal, Transaction } from './types';

const tokenKey = 'fintrack-token';
let token: string | null = sessionStorage.getItem(tokenKey);
let onUnauthorized: (() => void) | undefined;

export function setToken(value: string | null) {
  token = value;
  if (value) sessionStorage.setItem(tokenKey, value);
  else sessionStorage.removeItem(tokenKey);
}

export const hasToken = () => token !== null;
export const setUnauthorizedHandler = (handler: () => void) => { onUnauthorized = handler; };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && token) {
    setToken(null);
    onUnauthorized?.();
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, response.status));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function getErrorMessage(body: unknown, status: number) {
  if (body && typeof body === 'object') {
    const value = body as { error?: unknown; title?: unknown; errors?: Record<string, string[]> };
    if (typeof value.error === 'string') return value.error;
    if (typeof value.title === 'string') return value.title;
    const validationMessage = value.errors && Object.values(value.errors).flat()[0];
    if (validationMessage) return validationMessage;
  }

  return `A szerver hibát jelzett (${status}).`;
}

export async function getFinanceData(signal?: AbortSignal): Promise<FinanceData> {
  const [transactions, categories, budgets] = await Promise.all([
    request<Transaction[]>('/transactions', { signal }),
    request<Category[]>('/categories', { signal }),
    request<Budget[]>('/budgets', { signal }),
  ]);

  return { transactions, categories, budgets };
}

export function importCategories(categories: Category[]) {
  return request<{ imported: number }>('/categories/import', {
    method: 'POST',
    body: JSON.stringify({ categories }),
  });
}

type CreatedTransaction = {
  id: string;
  title: string;
  categoryId: string;
  amount: number;
  date: string;
};

export async function createTransaction(transaction: {
  title: string;
  categoryId: string;
  amount: number;
  date: string;
  suggestionId?: string;
}): Promise<Transaction> {
  const created = await request<CreatedTransaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });

  return {
    id: created.id,
    categoryId: created.categoryId,
    amount: created.amount,
    currency: 'HUF',
    startedAt: `${created.date}T00:00:00.0000000Z`,
    description: created.title,
  };
}

export function createCategory(category: Omit<Category, 'id'>) {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

type AuthResult = { token: string; user: AuthUser };

async function authenticate(path: string, body: object) {
  const result = await request<AuthResult>(path, { method: 'POST', body: JSON.stringify(body) });
  setToken(result.token);
  return result.user;
}

export const getAuthStatus = () => request<{ bootstrapRequired: boolean }>('/auth/status');
export const login = (email: string, password: string) => authenticate('/auth/login', { email, password });
export const bootstrap = (email: string, displayName: string, password: string) =>
  authenticate('/auth/bootstrap', { email, displayName, password });
export const getMe = () => request<AuthUser>('/auth/me');
export const createMember = (email: string, displayName: string, password: string) =>
  request<AuthUser>('/users', { method: 'POST', body: JSON.stringify({ email, displayName, password }) });
export const suggestCategory = (title: string, amount: number) =>
  request<CategorySuggestion>('/transactions/category-suggestions', { method: 'POST', body: JSON.stringify({ title, amount }) });
export const proposeCategory = (suggestionId: string) =>
  request<void>(`/category-suggestions/${suggestionId}/propose-category`, { method: 'POST' });
export const getPendingProposals = () => request<PendingProposal[]>('/category-suggestions/pending');
export const approveProposal = (suggestionId: string, name: string, color: string) =>
  request<Category>(`/category-suggestions/${suggestionId}/approve`, { method: 'POST', body: JSON.stringify({ name, color }) });
export const rejectProposal = (suggestionId: string) =>
  request<void>(`/category-suggestions/${suggestionId}/reject`, { method: 'POST' });

export function updateBudget(categoryId: string, limit: number) {
  return request<Budget>(`/budgets/${encodeURIComponent(categoryId)}`, {
    method: 'PUT',
    body: JSON.stringify({ limit }),
  });
}
import type { Budget, Category, FinanceData, Transaction } from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

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

export function createTransaction(transaction: Omit<Transaction, 'id'>) {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
}

export function createCategory(category: Omit<Category, 'id'>) {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

export function updateBudget(categoryId: string, limit: number) {
  return request<Budget>(`/budgets/${encodeURIComponent(categoryId)}`, {
    method: 'PUT',
    body: JSON.stringify({ limit }),
  });
}
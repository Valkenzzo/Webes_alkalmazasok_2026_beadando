import type { Budget, Category, Transaction } from './types';

export const storageKey = 'fintrack-prototype-v1';

export const initialCategories: Category[] = [
  { id: 'food', name: 'Élelmiszer', color: '#f59e0b' },
  { id: 'housing', name: 'Lakhatás', color: '#6366f1' },
  { id: 'transport', name: 'Közlekedés', color: '#0ea5e9' },
  { id: 'leisure', name: 'Szórakozás', color: '#ec4899' },
  { id: 'health', name: 'Egészség', color: '#10b981' },
  { id: 'other', name: 'Egyéb', color: '#64748b' },
];

export const initialTransactions: Transaction[] = [
  { id: '1', title: 'Bevásárlás', categoryId: 'food', amount: 18450, date: '2026-09-15' },
  { id: '2', title: 'Havi albérlet', categoryId: 'housing', amount: 185000, date: '2026-09-14' },
  { id: '3', title: 'Bérlet', categoryId: 'transport', amount: 9500, date: '2026-09-13' },
  { id: '4', title: 'Mozi', categoryId: 'leisure', amount: 5200, date: '2026-09-12' },
  { id: '5', title: 'Gyógyszertár', categoryId: 'health', amount: 6900, date: '2026-09-10' },
];

export const initialBudgets: Budget[] = [
  { categoryId: 'food', limit: 70000 },
  { categoryId: 'transport', limit: 30000 },
  { categoryId: 'leisure', limit: 25000 },
  { categoryId: 'health', limit: 20000 },
];

export const currency = new Intl.NumberFormat('hu-HU', {
  style: 'currency',
  currency: 'HUF',
  maximumFractionDigits: 0,
});

export function getCategorySpend(
  categories: Category[],
  transactions: Transaction[],
) {
  return categories
    .map((category) => ({
      ...category,
      total: transactions
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
    .filter((category) => category.total > 0)
    .sort((first, second) => second.total - first.total);
}

export function getCategoryTotal(transactions: Transaction[], categoryId: string) {
  return transactions
    .filter((transaction) => transaction.categoryId === categoryId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
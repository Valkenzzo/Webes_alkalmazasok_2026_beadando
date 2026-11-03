import type { Category, Transaction } from './types';

export const storageKey = 'fintrack-prototype-v1';

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
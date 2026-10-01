import { initialBudgets, initialCategories, initialTransactions, storageKey } from './data';
import type { Budget, Category, FinanceData, Transaction } from './types';

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false;
  const category = value as Category;
  return typeof category.id === 'string'
    && typeof category.name === 'string'
    && typeof category.color === 'string';
}

function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const transaction = value as Transaction;
  return typeof transaction.id === 'string'
    && typeof transaction.title === 'string'
    && typeof transaction.categoryId === 'string'
    && Number.isFinite(transaction.amount)
    && transaction.amount > 0
    && typeof transaction.date === 'string';
}

function isBudget(value: unknown): value is Budget {
  if (!value || typeof value !== 'object') return false;
  const budget = value as Budget;
  return typeof budget.categoryId === 'string'
    && Number.isFinite(budget.limit)
    && budget.limit > 0;
}

export function loadFinanceData(): FinanceData {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return createInitialData();

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return createInitialData();

    const data = parsed as Partial<FinanceData>;
    return {
      transactions: Array.isArray(data.transactions)
        ? data.transactions.filter(isTransaction)
        : [...initialTransactions],
      categories: Array.isArray(data.categories)
        ? data.categories.filter(isCategory)
        : [...initialCategories],
      budgets: Array.isArray(data.budgets)
        ? data.budgets.filter(isBudget)
        : [...initialBudgets],
    };
  } catch {
    return createInitialData();
  }
}

export function saveFinanceData(data: FinanceData) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Storage can be unavailable or full; the in-memory app remains usable.
  }
}

function createInitialData(): FinanceData {
  return {
    transactions: [...initialTransactions],
    categories: [...initialCategories],
    budgets: [...initialBudgets],
  };
}
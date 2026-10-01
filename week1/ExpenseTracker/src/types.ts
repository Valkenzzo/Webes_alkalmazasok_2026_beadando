export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Transaction = {
  id: string;
  title: string;
  categoryId: string;
  amount: number;
  date: string;
};

export type Budget = {
  categoryId: string;
  limit: number;
};

export type FinanceData = {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
};

export type PageId = 'dashboard' | 'transactions' | 'categories' | 'budgets';
export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Transaction = {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  startedAt: string;
  description: string;
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

export type Role = 'Member' | 'FamilyAdmin';
export type AuthUser = { id: string; email: string; displayName: string; role: Role };
export type SuggestionOutcome = 'Match' | 'NewCategory' | 'Uncertain' | 'Unavailable';
export type CategorySuggestion = {
  suggestionId: string | null;
  outcome: SuggestionOutcome;
  categoryId: string | null;
  proposedCategoryName: string | null;
  confidence: number;
  reason: string;
};
export type PendingProposal = { id: string; proposedCategoryName: string; title: string; requestedBy: string };

export type PageId = 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'approvals';
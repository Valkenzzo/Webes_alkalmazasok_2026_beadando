import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { BudgetsView, CategoriesView, DashboardView, PageHeading, TransactionsView } from './components/FinanceViews';
import { CategoryModal, TransactionModal } from './components/EntryModals';
import { Navigation } from './components/Navigation';
import { getCategorySpend } from './data';
import { loadFinanceData, saveFinanceData } from './storage';
import type { Category, PageId } from './types';

export default function App() {
  const [financeData, setFinanceData] = useState(loadFinanceData);
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [modal, setModal] = useState<'transaction' | 'category' | null>(null);

  const categorySpend = useMemo(
    () => getCategorySpend(financeData.categories, financeData.transactions),
    [financeData.categories, financeData.transactions],
  );

  useEffect(() => {
    saveFinanceData(financeData);
  }, [financeData]);

  function addTransaction(title: string, categoryId: string, amount: number, date: string) {
    setFinanceData((current) => ({
      ...current,
      transactions: [{ id: crypto.randomUUID(), title, categoryId, amount, date }, ...current.transactions],
    }));
    setModal(null);
  }

  function addCategory(name: string, color: string) {
    const category: Category = { id: crypto.randomUUID(), name, color };
    setFinanceData((current) => ({ ...current, categories: [...current.categories, category] }));
    setModal(null);
  }

  const filteredTransactions = transactionFilter === 'all'
    ? financeData.transactions
    : financeData.transactions.filter((transaction) => transaction.categoryId === transactionFilter);

  return (
    <div className="app">
      <Navigation activePage={activePage} onNavigate={setActivePage} />
      <main>
        <header>
          <div><PageHeading page={activePage} /></div>
          <button className="primary" onClick={() => setModal('transaction')} type="button">
            <Plus size={18} /> Új kiadás
          </button>
        </header>

        {activePage === 'dashboard' && (
          <DashboardView
            budgets={financeData.budgets}
            categories={financeData.categories}
            categorySpend={categorySpend}
            transactions={financeData.transactions}
          />
        )}
        {activePage === 'transactions' && (
          <TransactionsView
            categories={financeData.categories}
            filter={transactionFilter}
            onFilterChange={setTransactionFilter}
            transactions={filteredTransactions}
          />
        )}
        {activePage === 'categories' && (
          <CategoriesView
            categories={financeData.categories}
            onAdd={() => setModal('category')}
            transactions={financeData.transactions}
          />
        )}
        {activePage === 'budgets' && (
          <BudgetsView
            budgets={financeData.budgets}
            categories={financeData.categories}
            transactions={financeData.transactions}
          />
        )}
      </main>

      {modal === 'transaction' && (
        <TransactionModal
          categories={financeData.categories}
          onAdd={addTransaction}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'category' && (
        <CategoryModal onAdd={addCategory} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
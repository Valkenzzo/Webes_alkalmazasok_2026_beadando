import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { BudgetsView, CategoriesView, DashboardView, PageHeading, TransactionsView } from './components/FinanceViews';
import { CategoryModal, TransactionModal } from './components/EntryModals';
import { Navigation } from './components/Navigation';
import { createCategory, createTransaction, getFinanceData, importCategories, updateBudget } from './api';
import { getCategorySpend } from './data';
import { hasImportedLegacyCategories, loadLegacyCategories, markLegacyCategoriesImported } from './storage';
import type { Category, FinanceData, PageId } from './types';

export default function App() {
  const [financeData, setFinanceData] = useState<FinanceData>({ transactions: [], categories: [], budgets: [] });
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [modal, setModal] = useState<'transaction' | 'category' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const categorySpend = useMemo(
    () => getCategorySpend(financeData.categories, financeData.transactions),
    [financeData.categories, financeData.transactions],
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (!hasImportedLegacyCategories()) {
          const legacyCategories = loadLegacyCategories();
          if (legacyCategories.length) await importCategories(legacyCategories);
          markLegacyCategoriesImported();
        }

        const loadedData = await getFinanceData(controller.signal);
        if (isActive) setFinanceData(loadedData);
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : 'Az adatok betöltése nem sikerült.');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [retryCount]);

  async function addTransaction(title: string, categoryId: string, amount: number, date: string) {
    const transaction = await createTransaction({ title, categoryId, amount, date });
    setFinanceData((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
    setModal(null);
  }

  async function addCategory(name: string, color: string) {
    const category: Category = await createCategory({ name, color });
    setFinanceData((current) => ({ ...current, categories: [...current.categories, category] }));
    setModal(null);
  }

  async function saveBudget(categoryId: string, limit: number) {
    const budget = await updateBudget(categoryId, limit);
    setFinanceData((current) => ({
      ...current,
      budgets: [...current.budgets.filter((item) => item.categoryId !== budget.categoryId), budget],
    }));
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
          <button className="primary" disabled={isLoading || loadError !== null} onClick={() => setModal('transaction')} type="button">
            <Plus size={18} /> Új kiadás
          </button>
        </header>

        {loadError && <div className="app-alert" role="alert"><span>{loadError}</span><button className="secondary" onClick={() => setRetryCount((count) => count + 1)} type="button">Újrapróbálás</button></div>}
        {isLoading && <section className="card full" role="status"><div className="empty">Pénzügyi adatok betöltése…</div></section>}
        {!isLoading && !loadError && activePage === 'dashboard' && (
          <DashboardView
            budgets={financeData.budgets}
            categories={financeData.categories}
            categorySpend={categorySpend}
            transactions={financeData.transactions}
          />
        )}
        {!isLoading && !loadError && activePage === 'transactions' && (
          <TransactionsView
            categories={financeData.categories}
            filter={transactionFilter}
            onFilterChange={setTransactionFilter}
            transactions={filteredTransactions}
          />
        )}
        {!isLoading && !loadError && activePage === 'categories' && (
          <CategoriesView
            categories={financeData.categories}
            onAdd={() => setModal('category')}
            transactions={financeData.transactions}
          />
        )}
        {!isLoading && !loadError && activePage === 'budgets' && (
          <BudgetsView
            budgets={financeData.budgets}
            categories={financeData.categories}
            onSave={saveBudget}
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
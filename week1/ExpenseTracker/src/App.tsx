import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { BudgetsView, CategoriesView, DashboardView, PageHeading, TransactionsView } from './components/FinanceViews';
import { CategoryModal, TransactionModal } from './components/EntryModals';
import { Navigation } from './components/Navigation';
import { ApprovalsView } from './components/ApprovalsView';
import { LoginView } from './components/LoginView';
import { createCategory, createTransaction, getFinanceData, getMe, hasToken, importCategories, setToken, setUnauthorizedHandler, updateBudget } from './api';
import { getCategorySpend } from './data';
import { hasImportedLegacyCategories, loadLegacyCategories, markLegacyCategoriesImported } from './storage';
import type { AuthUser, Category, FinanceData, PageId } from './types';

export default function App() {
  const [financeData, setFinanceData] = useState<FinanceData>({ transactions: [], categories: [], budgets: [] });
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [modal, setModal] = useState<'transaction' | 'category' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(!hasToken());

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    if (!hasToken()) return;
    getMe().then(setUser).catch(() => setToken(null)).finally(() => setAuthChecked(true));
  }, []);

  const categorySpend = useMemo(
    () => getCategorySpend(financeData.categories, financeData.transactions),
    [financeData.categories, financeData.transactions],
  );

  useEffect(() => {
    const controller = new AbortController();
    if (!user) return;
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
  }, [retryCount, user]);

  async function addTransaction(title: string, categoryId: string, amount: number, date: string, suggestionId?: string) {
    const transaction = await createTransaction({ title, categoryId, amount, date, suggestionId });
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

  function logout() {
    setToken(null);
    setUser(null);
    setFinanceData({ transactions: [], categories: [], budgets: [] });
    setActivePage('dashboard');
  }

  if (!authChecked) return null;
  if (!user) return <LoginView onLoggedIn={setUser} />;

  const filteredTransactions = transactionFilter === 'all'
    ? financeData.transactions
    : financeData.transactions.filter((transaction) => transaction.categoryId === transactionFilter);

  return (
    <div className="app">
      <Navigation activePage={activePage} onLogout={logout} onNavigate={setActivePage} user={user} />
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
        {activePage === 'approvals' && user.role === 'FamilyAdmin' && (
          <ApprovalsView
            onApproved={(category) => setFinanceData((current) => ({ ...current, categories: [...current.categories, category] }))}
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
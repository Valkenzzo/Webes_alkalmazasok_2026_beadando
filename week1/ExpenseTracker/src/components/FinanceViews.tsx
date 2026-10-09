import { ArrowDownLeft, Check, Pencil, Plus, Tags, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { currency, getCategoryTotal } from '../data';
import type { Budget, Category, PageId, Transaction } from '../types';

type SummaryCategory = Category & { total: number };

type DashboardProps = {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  categorySpend: SummaryCategory[];
};

export function PageHeading({ page }: { page: PageId }) {
  const titles: Record<PageId, string> = {
    dashboard: 'Jó napot!',
    transactions: 'Tranzakciók',
    categories: 'Kategóriák',
    budgets: 'Költségkeretek',
  };

  return <><p className="eyebrow">PÉNZÜGYI ÁTTEKINTÉS</p><h1>{titles[page]}</h1></>;
}

export function DashboardView({ transactions, categories, budgets, categorySpend }: DashboardProps) {
  const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const budgetTotal = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  return (
    <>
      <section className="stats">
        <Stat label="Teljes kiadás" value={currency.format(spent)} hint="ebben a hónapban" />
        <Stat label="Költségkeretek" value={currency.format(budgetTotal)} hint="beállított havi keret" />
        <Stat label="Tranzakciók" value={String(transactions.length)} hint="összes rögzített tétel" />
        <Stat
          label="Legnagyobb kategória"
          value={categorySpend[0]?.name ?? '—'}
          hint={categorySpend[0] ? currency.format(categorySpend[0].total) : ''}
        />
      </section>
      <div className="grid">
        <section className="card large">
          <div className="card-head"><div><h2>Költések kategóriánként</h2><p>Az aktuális hónap összes kiadása</p></div></div>
          <div className="bars">
            {categorySpend.map((category) => (
              <div className="bar-row" key={category.id}>
                <div className="bar-label">
                  <span className="dot" style={{ background: category.color }} />
                  {category.name}<b>{currency.format(category.total)}</b>
                </div>
                <div className="bar-bg">
                  <div
                    className="bar"
                    style={{
                      width: `${Math.min(100, category.total / (categorySpend[0]?.total || 1) * 100)}%`,
                      background: category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Költségkeretek</h2><p>Hol tartasz ebben a hónapban?</p></div></div>
          {budgets.map((budget) => {
            const category = categories.find((item) => item.id === budget.categoryId);
            const used = getCategoryTotal(transactions, budget.categoryId);
            return (
              <div className="budget" key={budget.categoryId}>
                <div><span>{category?.name ?? 'Ismeretlen kategória'}</span><b>{currency.format(used)} / {currency.format(budget.limit)}</b></div>
                <div className="bar-bg"><div className="bar" style={{ width: `${Math.min(100, used / budget.limit * 100)}%` }} /></div>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}

export function TransactionsView({
  transactions,
  categories,
  filter,
  onFilterChange,
}: {
  transactions: Transaction[];
  categories: Category[];
  filter: string;
  onFilterChange: (categoryId: string) => void;
}) {
  return (
    <section className="card full">
      <div className="toolbar">
        <div><h2>Tranzakciólista</h2><p>Új kiadásokat itt tudsz rögzíteni.</p></div>
        <select aria-label="Szűrés kategória szerint" value={filter} onChange={(event) => onFilterChange(event.target.value)}>
          <option value="all">Minden kategória</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <TransactionList transactions={transactions} categories={categories} />
    </section>
  );
}

export function CategoriesView({ categories, transactions, onAdd }: {
  categories: Category[];
  transactions: Transaction[];
  onAdd: () => void;
}) {
  return (
    <section className="card full">
      <div className="toolbar">
        <div><h2>Kategóriák</h2><p>A kiadások csoportosításához használt kategóriák.</p></div>
        <button className="secondary" onClick={onAdd} type="button"><Plus size={17} /> Új kategória</button>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <div className="category-card" key={category.id}>
            <span className="category-icon" style={{ background: category.color }}><Tags size={18} /></span>
            <div><b>{category.name}</b><span>{currency.format(getCategoryTotal(transactions, category.id))} kiadás</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BudgetsView({ budgets, categories, transactions, onSave }: {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onSave: (categoryId: string, limit: number) => Promise<void>;
}) {
  return (
    <section className="card full">
      <div className="toolbar"><div><h2>Havi költségkeretek</h2><p>Egyszerű kontroll a legfontosabb kiadási kategóriák felett.</p></div></div>
      {budgets.map((budget) => {
        const category = categories.find((item) => item.id === budget.categoryId);
        const used = getCategoryTotal(transactions, budget.categoryId);
        return (
          <BudgetEditor
            budget={budget}
            category={category}
            key={budget.categoryId}
            onSave={onSave}
            used={used}
          />
        );
      })}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>;
}

function TransactionList({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  return (
    <div className="transactions">
      {transactions.map((transaction) => {
        const category = categories.find((item) => item.id === transaction.categoryId);
        return (
          <div className="tx" key={transaction.id}>
            <div className="tx-icon" style={{ background: category?.color }}><ArrowDownLeft size={17} /></div>
            <div className="tx-main">
              <b>{transaction.title}</b>
              <span>{category?.name ?? 'Ismeretlen kategória'} · {new Date(`${transaction.date}T00:00:00`).toLocaleDateString('hu-HU')}</span>
            </div>
            <strong>-{currency.format(transaction.amount)}</strong>
          </div>
        );
      })}
      {!transactions.length && <div className="empty">Nincs ilyen kategóriájú tranzakció.</div>}
    </div>
  );
}

function BudgetEditor({ budget, category, used, onSave }: {
  budget: Budget;
  category: Category | undefined;
  used: number;
  onSave: (categoryId: string, limit: number) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [limitInput, setLimitInput] = useState(String(budget.limit));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const percentage = Math.round(used / budget.limit * 100);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limit = Number(limitInput);
    if (!Number.isFinite(limit) || limit <= 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSave(budget.categoryId, limit);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'A keret mentése nem sikerült.');
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEdit() {
    setLimitInput(String(budget.limit));
    setError(null);
    setIsEditing(false);
  }

  return (
    <div className="budget big">
      <div className="budget-top">
        <div><span className="dot" style={{ background: category?.color }} /><b>{category?.name ?? 'Ismeretlen kategória'}</b></div>
        <div className="budget-actions">
          <strong>{percentage}%</strong>
          {!isEditing && <button aria-label={`Keret szerkesztése: ${category?.name ?? ''}`} className="icon-button" onClick={() => setIsEditing(true)} type="button"><Pencil size={16} /></button>}
        </div>
      </div>
      <div className="bar-bg"><div className="bar" style={{ width: `${Math.min(100, percentage)}%`, background: category?.color }} /></div>
      <div className="budget-meta"><span>Elköltve: {currency.format(used)}</span><span>Keret: {currency.format(budget.limit)}</span></div>
      {isEditing && (
        <form className="budget-edit" onSubmit={submit}>
          <label htmlFor={`budget-${budget.categoryId}`}>Havi keret (Ft)</label>
          <input
            id={`budget-${budget.categoryId}`}
            max="1000000000"
            min="1"
            onChange={(event) => setLimitInput(event.target.value)}
            required
            step="1"
            type="number"
            value={limitInput}
          />
          <button aria-label="Keret mentése" className="icon-button" disabled={isSaving || Number(limitInput) <= 0} type="submit"><Check size={17} /></button>
          <button aria-label="Szerkesztés megszakítása" className="icon-button" disabled={isSaving} onClick={cancelEdit} type="button"><X size={17} /></button>
          {isSaving && <span role="status">Mentés…</span>}
          {error && <span className="inline-error" role="alert">{error}</span>}
        </form>
      )}
    </div>
  );
}
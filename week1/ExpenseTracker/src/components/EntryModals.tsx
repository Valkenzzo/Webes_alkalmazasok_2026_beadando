import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { getLocalDateString } from '../data';
import type { Category } from '../types';

export function TransactionModal({ categories, onClose, onAdd }: {
  categories: Category[];
  onClose: () => void;
  onAdd: (title: string, categoryId: string, amount: number, date: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getLocalDateString());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const value = Number(amount);
    if (!normalizedTitle || !categoryId || !Number.isFinite(value) || value <= 0) return;
    onAdd(normalizedTitle, categoryId, value, date);
  }

  return (
    <Modal title="Új kiadás" onClose={onClose}>
      <form onSubmit={submit}>
        <label>Megnevezés<input autoFocus maxLength={80} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Pl. Bevásárlás" /></label>
        <label>Kategória<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        <label>Összeg (Ft)<input type="number" min="1" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label>
        <label>Dátum<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <button className="primary wide" disabled={!categories.length || !title.trim() || Number(amount) <= 0} type="submit">Kiadás mentése</button>
      </form>
    </Modal>
  );
}

export function CategoryModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2974A6');
  const colors = ['#2974A6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#ef4444'];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName) onAdd(normalizedName, color);
  }

  return (
    <Modal title="Új kategória" onClose={onClose}>
      <form onSubmit={submit}>
        <label>Kategória neve<input autoFocus maxLength={40} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Pl. Hobbi" /></label>
        <label>Szín<div className="color-row">
          {colors.map((option) => (
            <button
              aria-label={`Szín: ${option}`}
              aria-pressed={color === option}
              className={`color ${color === option ? 'selected' : ''}`}
              key={option}
              onClick={() => setColor(option)}
              style={{ background: option }}
              type="button"
            />
          ))}
        </div></label>
        <button className="primary wide" disabled={!name.trim()} type="submit">Kategória létrehozása</button>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div aria-labelledby="modal-title" aria-modal="true" className="modal" role="dialog">
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button aria-label="Bezárás" onClick={onClose} type="button"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
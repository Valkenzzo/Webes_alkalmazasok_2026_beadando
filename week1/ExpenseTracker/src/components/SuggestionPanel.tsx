import { useState } from 'react';
import { proposeCategory, suggestCategory } from '../api';
import type { Category, CategorySuggestion } from '../types';

const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'A javaslat nem sikerült.');

export function SuggestionPanel({ title, amount, categories, onApply }: {
  title: string;
  amount: string;
  categories: Category[];
  onApply: (categoryId: string, suggestionId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CategorySuggestion | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const value = Number(amount);
  const canAsk = title.trim().length > 0 && Number.isFinite(value) && value > 0;
  const suggestionId = result?.suggestionId ?? null;
  const category = categories.find((item) => item.id === result?.categoryId);

  async function ask() {
    setBusy(true);
    setNote(null);
    setResult(null);
    try {
      setResult(await suggestCategory(title.trim(), value));
    } catch (error) {
      setNote(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  async function propose() {
    if (!suggestionId) return;
    try {
      await proposeCategory(suggestionId);
      setResult(null);
      setNote('Jóváhagyásra elküldve a Családi adminnak.');
    } catch (error) {
      setNote(messageOf(error));
    }
  }

  return (
    <div className="suggestion">
      <button className="secondary" disabled={!canAsk || busy} onClick={() => void ask()} type="button">
        {busy ? 'Javaslat kérése…' : 'AI kategória javaslat'}
      </button>
      {result?.outcome === 'Match' && category && suggestionId && (
        <p>
          Javaslat: <b>{category.name}</b> ({Math.round(result.confidence * 100)}%) – {result.reason}{' '}
          <button className="secondary" onClick={() => onApply(category.id, suggestionId)} type="button">Elfogadom</button>
        </p>
      )}
      {result?.outcome === 'NewCategory' && suggestionId && (
        <p>
          Új kategória javaslat: <b>{result.proposedCategoryName}</b> – {result.reason}{' '}
          <button className="secondary" onClick={() => void propose()} type="button">Jóváhagyásra küldés</button>
        </p>
      )}
      {result?.outcome === 'Uncertain' && <p>Nem sikerült megbízhatóan besorolni, válassz kategóriát kézzel.</p>}
      {result?.outcome === 'Unavailable' && <p>A javaslat most nem érhető el, válassz kategóriát kézzel.</p>}
      {note && <p role="status">{note}</p>}
    </div>
  );
}

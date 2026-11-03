import { useEffect, useRef, useState } from 'react';
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
  const requestVersion = useRef(0);
  const value = Number(amount);
  const normalizedTitle = title.trim();
  const canAsk = normalizedTitle.length > 0 && Number.isFinite(value) && value > 0;
  const suggestionId = result?.suggestionId ?? null;
  const category = categories.find((item) => item.id === result?.categoryId);

  useEffect(() => {
    const version = ++requestVersion.current;
    setResult(null);
    setNote(null);

    if (!canAsk) {
      setBusy(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setBusy(true);
      try {
        const suggestion = await suggestCategory(normalizedTitle, value);
        if (version === requestVersion.current) setResult(suggestion);
      } catch (error) {
        if (version === requestVersion.current) setNote(messageOf(error));
      } finally {
        if (version === requestVersion.current) setBusy(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      requestVersion.current++;
    };
  }, [canAsk, normalizedTitle, value]);

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
      {busy && <p role="status">AI kategóriajavaslat készül…</p>}
      {!canAsk && <p>Add meg a kiadás nevét és összegét az automatikus javaslathoz.</p>}
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
      {result?.outcome === 'Uncertain' && <p>{result.reason || 'Nem sikerült megbízhatóan besorolni.'} Válassz kategóriát kézzel.</p>}
      {result?.outcome === 'Unavailable' && <p>{result.reason || 'A javaslat most nem érhető el.'}</p>}
      {note && <p role="status">{note}</p>}
    </div>
  );
}

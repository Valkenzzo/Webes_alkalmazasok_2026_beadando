import { useEffect, useState, type FormEvent } from 'react';
import { approveProposal, createMember, getPendingProposals, rejectProposal } from '../api';
import type { Category, PendingProposal } from '../types';

const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'Hiba történt.');

export function ApprovalsView({ onApproved }: { onApproved: (category: Category) => void }) {
  const [items, setItems] = useState<PendingProposal[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [member, setMember] = useState({ email: '', displayName: '', password: '' });

  useEffect(() => {
    getPendingProposals().then(setItems).catch((error) => setMessage(messageOf(error)));
  }, []);

  async function decide(item: PendingProposal, approve: boolean) {
    setBusyId(item.id);
    setMessage(null);
    try {
      if (approve) {
        onApproved(await approveProposal(item.id, names[item.id] ?? item.proposedCategoryName, colors[item.id] ?? '#2974a6'));
      } else {
        await rejectProposal(item.id);
      }
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    } catch (error) {
      setMessage(messageOf(error));
    } finally {
      setBusyId(null);
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await createMember(member.email, member.displayName, member.password);
      setMember({ email: '', displayName: '', password: '' });
      setMessage('A felhasználó létrejött.');
    } catch (error) {
      setMessage(messageOf(error));
    }
  }

  return (
    <section className="card full">
      <div className="toolbar"><div><h2>Új kategória javaslatok</h2><p>Az AI által javasolt, még nem létező kategóriák jóváhagyása.</p></div></div>
      {!items.length && <div className="empty">Nincs jóváhagyásra váró javaslat.</div>}
      {items.map((item) => (
        <div className="budget big" key={item.id}>
          <div className="budget-top"><div><b>{item.proposedCategoryName}</b></div><span>{item.requestedBy}: {item.title}</span></div>
          <form className="budget-edit" onSubmit={(event) => { event.preventDefault(); void decide(item, true); }}>
            <input
              aria-label="Kategória neve"
              maxLength={40}
              required
              value={names[item.id] ?? item.proposedCategoryName}
              onChange={(event) => setNames((current) => ({ ...current, [item.id]: event.target.value }))}
            />
            <input
              aria-label="Szín"
              type="color"
              value={colors[item.id] ?? '#2974a6'}
              onChange={(event) => setColors((current) => ({ ...current, [item.id]: event.target.value }))}
            />
            <button className="primary" disabled={busyId === item.id} type="submit">Jóváhagyás</button>
            <button className="secondary" disabled={busyId === item.id} onClick={() => void decide(item, false)} type="button">Elutasítás</button>
          </form>
        </div>
      ))}
      <div className="toolbar"><div><h2>Új családtag</h2><p>Felhasználó szerepkörű fiók létrehozása.</p></div></div>
      <form className="budget-edit" onSubmit={addMember}>
        <input aria-label="E-mail" placeholder="E-mail" required type="email" value={member.email} onChange={(event) => setMember({ ...member, email: event.target.value })} />
        <input aria-label="Név" maxLength={60} placeholder="Név" required value={member.displayName} onChange={(event) => setMember({ ...member, displayName: event.target.value })} />
        <input aria-label="Jelszó" minLength={8} placeholder="Jelszó (min. 8)" required type="password" value={member.password} onChange={(event) => setMember({ ...member, password: event.target.value })} />
        <button className="secondary" type="submit">Létrehozás</button>
      </form>
      {message && <p className="inline-error" role="status">{message}</p>}
    </section>
  );
}

import { useState, type FormEvent } from 'react';
import { createMember } from '../api';

const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'Hiba történt.');

export function ApprovalsView() {
  const [message, setMessage] = useState<string | null>(null);
  const [member, setMember] = useState({ email: '', displayName: '', password: '' });

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

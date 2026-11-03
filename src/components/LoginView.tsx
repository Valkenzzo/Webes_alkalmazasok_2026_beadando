import { useEffect, useState, type FormEvent } from 'react';
import { bootstrap, getAuthStatus, login } from '../api';
import type { AuthUser } from '../types';

export function LoginView({ onLoggedIn }: { onLoggedIn: (user: AuthUser) => void }) {
  const [bootstrapRequired, setBootstrapRequired] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAuthStatus()
      .then((status) => setBootstrapRequired(status.bootstrapRequired))
      .catch(() => setError('A szerver nem érhető el.'));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLoggedIn(bootstrapRequired ? await bootstrap(email, displayName, password) : await login(email, password));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'A bejelentkezés nem sikerült.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head"><h2>{bootstrapRequired ? 'Családi admin létrehozása' : 'Bejelentkezés'}</h2></div>
        <label>E-mail<input autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        {bootstrapRequired && (
          <label>Név<input maxLength={60} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
        )}
        <label>Jelszó<input
          autoComplete={bootstrapRequired ? 'new-password' : 'current-password'}
          minLength={8}
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        /></label>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button className="primary wide" disabled={busy} type="submit">
          {busy ? 'Folyamatban…' : bootstrapRequired ? 'Létrehozás' : 'Belépés'}
        </button>
      </form>
    </div>
  );
}

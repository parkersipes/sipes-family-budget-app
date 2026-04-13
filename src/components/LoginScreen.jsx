import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setErr(prettyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-accent text-xs tracking-[0.3em] uppercase mb-3">Sipes</div>
          <div className="text-ink text-2xl font-semibold">Family Budget</div>
          <div className="text-ink-muted text-sm mt-2">Private. Two accounts only.</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">Email</div>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-raised border border-line rounded-lg px-4 py-3 text-ink focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">Password</div>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-raised border border-line rounded-lg px-4 py-3 text-ink focus:border-accent focus:outline-none"
            />
          </label>
          {err && <div className="text-bad text-sm">{err}</div>}
          <button
            disabled={busy}
            className="w-full bg-accent text-black font-semibold rounded-lg py-3 press disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function prettyAuthError(e) {
  const code = e?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Email or password is incorrect.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  return e?.message || 'Sign in failed.';
}

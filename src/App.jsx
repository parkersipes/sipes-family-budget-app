import { useState } from 'react';
import { useAuth } from './hooks/useAuth.js';
import LoginScreen from './components/LoginScreen.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [route, setRoute] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-ink-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  if (route === 'settings') {
    return <Settings user={user} onClose={() => setRoute('dashboard')} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => logout().catch(() => {})}
      onOpenSettings={() => setRoute('settings')}
    />
  );
}

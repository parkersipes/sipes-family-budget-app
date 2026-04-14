import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import LoginScreen from './components/LoginScreen.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SettingsIndex from './pages/SettingsIndex.jsx';
import SettingsFixedIncome from './pages/SettingsFixedIncome.jsx';
import SettingsFixedBills from './pages/SettingsFixedBills.jsx';
import SettingsCategories from './pages/SettingsCategories.jsx';
import AddTransactionPage from './pages/AddTransactionPage.jsx';
import AddIncomePage from './pages/AddIncomePage.jsx';
import CategoryDetailPage from './pages/CategoryDetailPage.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-ink-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginScreen />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const handleLogout = () => logout().catch(() => {});

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/m/:monthKey" element={<Dashboard user={user} />} />
        <Route path="/m/:monthKey/category/:categoryId" element={<CategoryDetailPage />} />
        <Route path="/category/:categoryId" element={<CategoryDetailPage />} />

        <Route path="/settings" element={<SettingsIndex onLogout={handleLogout} />} />
        <Route path="/settings/income" element={<SettingsFixedIncome />} />
        <Route path="/settings/bills" element={<SettingsFixedBills />} />
        <Route path="/settings/categories" element={<SettingsCategories />} />

        <Route path="/add/transaction" element={<AddTransactionPage user={user} />} />
        <Route path="/add/income" element={<AddIncomePage user={user} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

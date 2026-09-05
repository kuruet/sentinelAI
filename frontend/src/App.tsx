import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import IntelligencePage from './pages/IntelligencePage';
import InvestigationPage from './pages/InvestigationPage';
import LoginPage from './pages/LoginPage';

function ProtectedApplication() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </ProtectedRoute>
  );
}

function App() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="auth-loading" role="status">
        <div className="auth-loading__indicator" aria-hidden="true" />
        <span>Initializing SentinelAI…</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<ProtectedApplication />} />
    </Routes>
  );
}

export default App;

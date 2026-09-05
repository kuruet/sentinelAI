import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import TimelinePage from './pages/TimelinePage';
import EvidencePage from './pages/EvidencePage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IntelligencePage from './pages/IntelligencePage';
import IncidentSummaryPage from './pages/IncidentSummaryPage';
import InvestigationAssistantPage from './pages/InvestigationAssistantPage';
import RootCauseAnalysisPage from './pages/RootCauseAnalysisPage';
import InvestigationPage from './pages/InvestigationPage';
import LoginPage from './pages/LoginPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ExplainabilityPage from './pages/ExplainabilityPage';

function ProtectedApplication() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/incidents/:id/timeline" element={<TimelinePage />} />
          <Route path="/incidents/:id/evidence" element={<EvidencePage />} />
          <Route path="/incidents/:id/investigation" element={<InvestigationPage />} />
          <Route path="/incidents/:id/intelligence" element={<IntelligencePage />} />
          <Route path="/incidents/:id/intelligence/summary" element={<IncidentSummaryPage />} />
          <Route
            path="/incidents/:id/intelligence/assistant"
            element={<InvestigationAssistantPage />}
          />{' '}
          <Route
            path="/incidents/:id/intelligence/root-cause"
            element={<RootCauseAnalysisPage />}
          />
          <Route
            path="/incidents/:id/intelligence/recommendations"
            element={<RecommendationsPage />}
          />{' '}
          <Route
            path="/incidents/:id/intelligence/explainability"
            element={<ExplainabilityPage />}
          />
          <Route path="/incidents/new" element={<CreateIncidentPage />} />
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

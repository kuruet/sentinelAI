import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <div className="auth-loading__indicator" aria-hidden="true" />
        <span>Verifying session…</span>
      </div>
    );
  }

  if (status !== 'authenticated') {
    const from = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/login" replace state={{ from }} />;
  }

  return children;
}

export default ProtectedRoute;

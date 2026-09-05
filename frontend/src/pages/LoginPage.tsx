import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthProvider';

function getSafeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '/';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, authError, loginWithToken } = useAuth();

  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(authError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithToken(token);

      const from = getSafeReturnPath(location.state?.from);
      navigate(from, { replace: true });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Authentication failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-page__panel" aria-labelledby="login-title">
        <div className="auth-page__brand">
          <div className="auth-page__mark" aria-hidden="true">
            S
          </div>
          <div>
            <div className="auth-page__product">SentinelAI</div>
            <div className="auth-page__caption">Incident Intelligence</div>
          </div>
        </div>

        <Card className="auth-card">
          <div className="auth-card__header">
            <p className="eyebrow">Secure access</p>
            <h1 id="login-title">Sign in to SentinelAI</h1>
            <p>
              Authenticate with a valid SentinelAI access token to enter the incident operations
              workspace.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-form__label" htmlFor="access-token">
              Access token
            </label>

            <input
              id="access-token"
              name="access-token"
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Paste access token"
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'authentication-error' : undefined}
              required
            />

            {error ? (
              <div id="authentication-error" className="auth-form__error" role="alert">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || token.trim().length === 0}
            >
              {isSubmitting ? 'Authenticating…' : 'Sign in'}
            </Button>
          </form>

          <div className="auth-card__notice">
            <strong>Authentication service status</strong>
            <span>
              SentinelAI currently verifies JWT credentials through the protected API. Credential
              issuance is handled by the backend authentication service.
            </span>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default LoginPage;

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

function TopBar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar__context">
        <span className="app-topbar__product">Incident Operations</span>
      </div>

      <div className="app-topbar__actions">
        <div className="app-topbar__environment">
          <span className="app-topbar__environment-dot" aria-hidden="true" />
          <span>Local</span>
        </div>

        <div className="app-topbar__user" aria-label="Current user">
          <span className="app-topbar__avatar" aria-hidden="true">
            U
          </span>
          <span className="app-topbar__user-name">Authenticated Operator</span>
          <button type="button" className="app-topbar__logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;

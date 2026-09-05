function TopBar() {
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
          <span className="app-topbar__user-name">Operator</span>
        </div>
      </div>
    </header>
  );
}

export default TopBar;

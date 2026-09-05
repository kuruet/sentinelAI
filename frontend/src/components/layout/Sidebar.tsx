import { NavLink } from 'react-router-dom';

const navigation = [
  {
    label: 'Dashboard',
    path: '/',
    icon: '▦',
  },
  {
    label: 'Incidents',
    path: '/incidents',
    icon: '◈',
  },
  {
    label: 'Investigation',
    path: '/investigation',
    icon: '⌕',
  },
  {
    label: 'Intelligence',
    path: '/intelligence',
    icon: '✦',
  },
];

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__mark" aria-hidden="true">
          S
        </div>

        <div>
          <div className="app-sidebar__name">SentinelAI</div>
          <div className="app-sidebar__caption">Incident Intelligence</div>
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label="Primary navigation">
        <div className="app-sidebar__section-label">Workspace</div>

        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`.trim()
            }
          >
            <span className="app-sidebar__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-sidebar__system">
          <span className="app-sidebar__status-dot" aria-hidden="true" />
          <span>System operational</span>
        </div>

        <div className="app-sidebar__version">SentinelAI · v0.1</div>
      </div>
    </aside>
  );
}

export default Sidebar;

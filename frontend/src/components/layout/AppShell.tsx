import type { PropsWithChildren } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-shell__body">
        <TopBar />

        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;

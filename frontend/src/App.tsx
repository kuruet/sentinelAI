import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import Card from './components/ui/Card';

function App() {
  return (
    <main className="app-root">
      <section className="app-root__content ui-container">
        <span className="app-root__eyebrow">SENTINELAI</span>

        <h1 className="ui-heading-1">Incident Intelligence Platform</h1>

        <p>Frontend design system foundation verified successfully.</p>

        <div className="ui-stack ui-stack--lg" style={{ marginTop: 'var(--space-8)' }}>
          <Card elevated style={{ padding: 'var(--space-6)' }}>
            <div className="ui-stack ui-stack--md">
              <div>
                <h2 className="ui-heading-3">Typography</h2>
                <p className="ui-secondary">
                  Consistent hierarchy, spacing, and readable text styles.
                </p>
              </div>

              <div className="ui-row ui-row--md ui-wrap">
                <span className="ui-text-xs ui-muted">XS</span>
                <span className="ui-text-sm ui-secondary">SM</span>
                <span className="ui-text-md">MD</span>
                <span className="ui-text-lg">LG</span>
                <span className="ui-mono">MONOSPACE</span>
              </div>
            </div>
          </Card>

          <Card elevated style={{ padding: 'var(--space-6)' }}>
            <div className="ui-stack ui-stack--md">
              <div>
                <h2 className="ui-heading-3">Controls & Status</h2>
                <p className="ui-secondary">
                  Reusable controls and incident-oriented status language.
                </p>
              </div>

              <div className="ui-row ui-row--md ui-wrap">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button disabled>Disabled</Button>
              </div>

              <div className="ui-row ui-row--md ui-wrap">
                <Badge variant="neutral">Unknown</Badge>
                <Badge variant="info">Active</Badge>
                <Badge variant="warning">Investigating</Badge>
                <Badge variant="success">Resolved</Badge>
                <Badge variant="danger">Critical</Badge>
              </div>
            </div>
          </Card>

          <div className="ui-grid ui-grid--3">
            <Card style={{ padding: 'var(--space-5)' }}>
              <span className="ui-mono ui-muted ui-text-xs">SEVERITY</span>
              <h3 className="ui-heading-3" style={{ marginTop: 'var(--space-2)' }}>
                Critical
              </h3>
              <p className="ui-secondary">Visual tokens are ready for incident workflows.</p>
            </Card>

            <Card style={{ padding: 'var(--space-5)' }}>
              <span className="ui-mono ui-muted ui-text-xs">RESPONSIVE</span>
              <h3 className="ui-heading-3" style={{ marginTop: 'var(--space-2)' }}>
                Adaptive
              </h3>
              <p className="ui-secondary">Layout utilities collapse cleanly on smaller screens.</p>
            </Card>

            <Card style={{ padding: 'var(--space-5)' }}>
              <span className="ui-mono ui-muted ui-text-xs">ACCESSIBILITY</span>
              <h3 className="ui-heading-3" style={{ marginTop: 'var(--space-2)' }}>
                Ready
              </h3>
              <p className="ui-secondary">Focus and reduced-motion foundations are included.</p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;

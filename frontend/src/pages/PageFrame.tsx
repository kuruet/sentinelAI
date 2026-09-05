import Card from '../components/ui/Card';

interface PageProps {
  eyebrow: string;
  title: string;
  description: string;
}

function PageFrame({ eyebrow, title, description }: PageProps) {
  return (
    <div className="page-frame">
      <div className="page-frame__header">
        <span className="page-frame__eyebrow">{eyebrow}</span>
        <h1 className="ui-heading-1">{title}</h1>
        <p>{description}</p>
      </div>

      <Card elevated className="page-frame__placeholder">
        <span className="ui-mono ui-text-xs ui-muted">APPLICATION SHELL</span>
        <h2 className="ui-heading-3">Workspace ready</h2>
        <p className="ui-secondary">
          This route is intentionally structural. Its feature implementation belongs to a later
          Phase 5 step.
        </p>
      </Card>
    </div>
  );
}

export default PageFrame;

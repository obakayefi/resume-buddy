import type { ReactNode } from 'react';
import type { BadgeTone } from './Badge';

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: Extract<BadgeTone, 'blue' | 'teal' | 'pink' | 'success' | 'warning'>;
}

export function MetricCard({ label, value, detail, icon, tone = 'blue' }: MetricCardProps) {
  return (
    <article className={`ui-metric-card ui-metric-${tone}`}>
      <div className="ui-metric-topline">
        <span className="ui-metric-label">{label}</span>
        {icon && <span className="ui-metric-icon" aria-hidden="true">{icon}</span>}
      </div>
      <strong className="ui-metric-value">{value}</strong>
      {detail && <span className="ui-metric-detail">{detail}</span>}
    </article>
  );
}

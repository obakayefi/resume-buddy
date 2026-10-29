import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';
const icons = { info: Info, success: CheckCircle2, warning: TriangleAlert, danger: AlertCircle };

export function Alert({ tone = 'info', title, children, role, className = '' }: { tone?: AlertTone; title?: string; children: ReactNode; role?: 'alert' | 'status'; className?: string }) {
  const Icon = icons[tone];
  return <div className={`ui-alert tone-${tone} ${className}`.trim()} role={role || (tone === 'danger' ? 'alert' : 'status')}>
    <Icon size={17} aria-hidden="true" />
    <div>{title && <strong>{title}</strong>}<div>{children}</div></div>
  </div>;
}

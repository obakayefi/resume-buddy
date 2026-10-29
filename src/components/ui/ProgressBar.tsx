interface ProgressBarProps {
  value: number;
  label: string;
  tone?: 'blue' | 'teal' | 'pink' | 'success';
  detail?: string;
}

export function ProgressBar({ value, label, tone = 'blue', detail }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="ui-progress-row">
      <div className="ui-progress-heading">
        <span>{label}</span>
        <strong>{detail || `${normalizedValue}%`}</strong>
      </div>
      <div className="ui-progress-track" role="progressbar" aria-label={label} aria-valuenow={normalizedValue} aria-valuemin={0} aria-valuemax={100}>
        <span className={`ui-progress-fill ui-progress-${tone}`} style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}

import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  leadingIcon?: ReactNode;
  error?: string;
}

export function TextField({ label, hint, error, leadingIcon, id, className = '', required, ...props }: TextFieldProps) {
  const inputId = id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`ui-field ${error ? 'has-error' : ''}`}>
      <label className="ui-field-label" htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div className={`ui-field-control ${leadingIcon ? 'has-leading-icon' : ''}`}>
        {leadingIcon && <span className="ui-field-icon" aria-hidden="true">{leadingIcon}</span>}
        <input id={inputId} className={`ui-input ${className}`.trim()} required={required} aria-invalid={error ? true : undefined} aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined} {...props} />
      </div>
      {hint && <small className="ui-field-hint" id={hintId}>{hint}</small>}
      {error && <small className="ui-field-error" id={errorId}>{error}</small>}
    </div>
  );
}

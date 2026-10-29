import type { TextareaHTMLAttributes } from 'react';

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextareaField({ label, hint, error, id, className = '', required, ...props }: TextareaFieldProps) {
  const inputId = id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return <div className={`ui-field ${error ? 'has-error' : ''}`}>
    <label className="ui-field-label" htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <textarea id={inputId} className={`ui-input ui-textarea ${className}`.trim()} required={required} aria-invalid={error ? true : undefined} aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined} {...props} />
    {hint && <small className="ui-field-hint" id={hintId}>{hint}</small>}
    {error && <small className="ui-field-error" id={errorId}>{error}</small>}
  </div>;
}

import type { InputHTMLAttributes } from 'react';

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function CheckboxField({ label, description, id, ...props }: CheckboxFieldProps) {
  const inputId = id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const descriptionId = description ? `${inputId}-description` : undefined;
  return <label className="ui-checkbox-field" htmlFor={inputId}>
    <input id={inputId} type="checkbox" aria-describedby={descriptionId} {...props} />
    <span><strong>{label}</strong>{description && <small id={descriptionId}>{description}</small>}</span>
  </label>;
}

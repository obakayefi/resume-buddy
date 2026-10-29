import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

export function IconButton({ label, children, tone = 'default', className = '', ...props }: IconButtonProps) {
  return <button type="button" aria-label={label} title={label} className={`ui-icon-button ${tone === 'danger' ? 'tone-danger' : ''} ${className}`.trim()} {...props}>{children}</button>;
}

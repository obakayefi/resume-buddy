import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`ui-button ui-button-${variant} ui-button-${size} ${className}`.trim()} {...props}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}

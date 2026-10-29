import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function Card({ title, description, action, className = '', children, ...props }: CardProps) {
  return (
    <section className={`ui-card ${className}`.trim()} {...props}>
      {(title || description || action) && (
        <header className="ui-card-header">
          <div>
            {title && <h2 className="ui-card-title">{title}</h2>}
            {description && <p className="ui-card-description">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

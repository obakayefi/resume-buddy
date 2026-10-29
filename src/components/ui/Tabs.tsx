import { useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';

export interface TabOption {
  id: string;
  label: string;
  description?: string;
  count?: number;
}

interface TabsProps {
  items: TabOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  idPrefix?: string;
}

export function Tabs({ items, value, onChange, label, className = '', orientation = 'horizontal', idPrefix }: TabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const prefix = idPrefix || generatedId;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const backward = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : items.length - 1;
      if (items[nextIndex]) { onChange(items[nextIndex].id); tabRefs.current[nextIndex]?.focus(); }
      return;
    }
    const direction = event.key === forward ? 1 : event.key === backward ? -1 : 0;
    if (!direction || !items.length) return;
    event.preventDefault();
    const nextIndex = (index + direction + items.length) % items.length;
    onChange(items[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={`ui-tabs ui-tabs-${orientation} ${className}`.trim()} role="tablist" aria-label={label} aria-orientation={orientation}>
      {items.map((item, index) => (
        <button
          key={item.id}
          id={`tab-${prefix}-${item.id}`}
          aria-controls={`panel-${prefix}-${item.id}`}
          tabIndex={value === item.id ? 0 : -1}
          ref={(element) => { tabRefs.current[index] = element; }}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`ui-tab ${value === item.id ? 'active' : ''}`}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {item.label}
          {item.count !== undefined && <span className="ui-tab-count">{item.count}</span>}
          {item.description && <small className="ui-tab-description">{item.description}</small>}
        </button>
      ))}
    </div>
  );
}

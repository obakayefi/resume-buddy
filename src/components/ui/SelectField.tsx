'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: ReactNode;
}

interface SelectFieldProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  leadingIcon?: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  name?: string;
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  hint,
  placeholder = 'Select an option',
  leadingIcon,
  defaultOpen = false,
  disabled = false,
  name,
}: SelectFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => {
    const result: Array<{ label?: string; options: SelectOption[] }> = [];
    for (const option of options) {
      let group = result.find((item) => item.label === option.group);
      if (!group) {
        group = { label: option.group, options: [] };
        result.push(group);
      }
      group.options.push(option);
    }
    return result;
  }, [options]);
  const selectedOption = options.find((option) => option.value === value);
  const generatedId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const baseId = name || `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${generatedId}`;
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-options`;
  const hintId = hint ? `${listboxId}-hint` : undefined;

  useEffect(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    if (selectedIndex >= 0) setActiveIndex(selectedIndex);
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  const chooseOption = (option: SelectOption) => {
    onChange(option.value);
    setActiveIndex(options.findIndex((item) => item.value === option.value));
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + offset + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (!open) {
        event.preventDefault();
        setOpen(true);
      } else if (options[activeIndex]) {
        event.preventDefault();
        chooseOption(options[activeIndex]);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  let flatIndex = -1;

  return (
    <div className={`ui-field ui-select-field ${open ? 'is-open' : ''}`} ref={rootRef}>
      <label className="ui-field-label" htmlFor={triggerId}>{label}</label>
      <button
        id={triggerId}
        type="button"
        className={`ui-input ui-select-trigger ${leadingIcon ? 'has-leading-icon' : ''}`}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-describedby={hintId}
        aria-activedescendant={open && options[activeIndex] ? `${listboxId}-${options[activeIndex].value}` : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        {leadingIcon && <span className="ui-select-leading-icon" aria-hidden="true">{leadingIcon}</span>}
        <span className={`ui-select-value ${selectedOption ? '' : 'is-placeholder'}`}>
          {selectedOption?.label || placeholder}
        </span>
        {selectedOption?.description && <span className="ui-select-selected-detail">{selectedOption.description}</span>}
        <ChevronDown className="ui-select-chevron" size={15} aria-hidden="true" />
      </button>

      {open && (
        <div className="ui-select-menu" id={listboxId} role="listbox" aria-label={label}>
          {groups.map((group, groupIndex) => (
            <div className="ui-select-group" key={`${group.label || 'options'}-${groupIndex}`}>
              {group.label && <div className="ui-select-group-label">{group.label}</div>}
              {group.options.map((option) => {
                flatIndex += 1;
                const optionIndex = flatIndex;
                const isSelected = option.value === value;
                const isActive = optionIndex === activeIndex;
                return (
                  <button
                    id={`${listboxId}-${option.value}`}
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    className={`ui-select-option ${isSelected ? 'is-selected' : ''} ${isActive ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(optionIndex)}
                    onClick={() => chooseOption(option)}
                  >
                    {option.icon && <span className="ui-select-option-icon" aria-hidden="true">{option.icon}</span>}
                    <span className="ui-select-option-copy">
                      <strong>{option.label}</strong>
                      {option.description && <small>{option.description}</small>}
                    </span>
                    {isSelected && <Check className="ui-select-option-check" size={15} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {hint && <small className="ui-field-hint" id={hintId}>{hint}</small>}
    </div>
  );
}

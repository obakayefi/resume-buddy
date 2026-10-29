export function CharacterCount({ value, max, label = 'characters' }: { value: string; max?: number; label?: string }) {
  const count = value.length;
  const over = max !== undefined && count > max;
  return <span className={`ui-character-count ${over ? 'is-over-limit' : ''}`} aria-live="polite">{count}{max !== undefined ? ` / ${max}` : ''} {label}</span>;
}

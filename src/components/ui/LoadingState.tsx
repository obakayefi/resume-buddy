import { LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Loading', compact = false }: { label?: string; compact?: boolean }) {
  return <div className={`ui-loading-state ${compact ? 'is-compact' : ''}`} role="status" aria-live="polite">
    <LoaderCircle className="ui-loading-spinner" size={compact ? 16 : 22} aria-hidden="true" />
    <span>{label}<span className="sr-only">…</span></span>
  </div>;
}

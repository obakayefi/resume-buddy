'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  return <Modal isOpen={isOpen} onClose={onCancel} title={title} subtitle={description} maxWidth={440} closeOnOverlayClick>
    <div className="ui-confirm-actions">
      <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Modal>;
}

export function useConfirmDialog() {
  const [request, setRequest] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'> | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setRequest(null);
  }, []);
  useEffect(() => () => { resolver.current?.(false); }, []);
  const confirm = useCallback((options: Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'>) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setRequest(options);
  }), []);
  const dialog = request ? <ConfirmDialog {...request} isOpen onConfirm={() => settle(true)} onCancel={() => settle(false)} /> : null;
  return { confirm, dialog };
}

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideClose?: boolean;
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideClose = false,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-md" />

      {/* Panel */}
      <div
        className={[
          'relative w-full',
          sizeClass[size],
          'surface p-6 shadow-lift rounded-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-bold text-slate-950 dark:text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-4 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </button>
      <button
        className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? 'Processing…' : confirmLabel}
      </button>
    </div>
  </Modal>
);

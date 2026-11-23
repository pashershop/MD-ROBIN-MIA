import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function AdminPanelCard({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[8px] border border-[#EAEAEA] bg-white p-5 sm:p-6 dark:border-[#222222] dark:bg-[#111111] ${className}`}
    >
      {(title || description || actions) && (
        <div className="mb-5 flex flex-col gap-3 border-b border-[#EAEAEA] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#222222]">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-[#000000] sm:text-lg dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold tracking-[0.1em] text-[#111111] uppercase dark:text-[#E5E5E5]"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[#707070] dark:text-[#A3A3A3]">{hint}</p>}
    </div>
  );
}

export const ADMIN_INPUT_CLASS =
  'mt-1.5 min-h-[44px] w-full rounded-[4px] border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white';

export const ADMIN_TEXTAREA_CLASS =
  'mt-1.5 w-full rounded-[4px] border border-[#EAEAEA] bg-white p-3 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white';

export const ADMIN_BTN_PRIMARY =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] border border-[#111111] bg-[#111111] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#000000] disabled:opacity-50 whitespace-nowrap shrink-0 dark:border-white dark:bg-white dark:text-[#111111] dark:hover:bg-[#EAEAEA]';

export const ADMIN_BTN_SECONDARY =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] border border-[#EAEAEA] bg-white px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#111111] uppercase transition-colors hover:border-[#111111] disabled:opacity-50 whitespace-nowrap shrink-0 dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:hover:border-white';

export const ADMIN_BTN_DANGER =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] border border-[#DC2626] bg-white px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#DC2626] uppercase transition-colors hover:bg-[#DC2626] hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 dark:bg-[#111111]';

export function AdminNotice({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error' | 'info';
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  const styles =
    type === 'error'
      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B] dark:bg-[#2A0F0F] dark:text-[#FCA5A5]'
      : type === 'success'
        ? 'border-[#111111] bg-[#F8F8F8] text-[#111111] dark:border-white dark:bg-[#1A1A1A] dark:text-white'
        : 'border-[#EAEAEA] bg-[#F8F8F8] text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-[#E5E5E5]';

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-[6px] border px-4 py-3 text-xs leading-relaxed ${styles}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="shrink-0 opacity-75 hover:opacity-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-[8px] border border-[#EAEAEA] bg-white p-6 text-[#111111] shadow-xl dark:border-[#222222] dark:bg-[#111111] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#111111] dark:text-white" aria-hidden="true" />
          <div>
            <h3 id="confirm-modal-title" className="text-base font-semibold text-[#000000] dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" disabled={busy} onClick={onCancel} className={ADMIN_BTN_SECONDARY}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={danger ? ADMIN_BTN_DANGER : ADMIN_BTN_PRIMARY}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

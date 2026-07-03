interface Props {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Themed in-app confirmation (replaces the native window.confirm).
export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#122318]/95 backdrop-blur-sm flex items-center justify-center px-6 fade-in [overscroll-behavior:contain]"
    >
      <div className="panel w-full max-w-sm p-6 text-center">
        <p className="font-display text-xl text-parchment mb-6 text-balance">
          {message}
        </p>
        <div className="flex flex-col gap-2.5">
          <button onClick={onConfirm} className="btn-brass text-base">
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="btn-quiet text-base">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

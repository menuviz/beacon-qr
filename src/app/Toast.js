"use client";

import { CheckIcon, XIcon } from "./icons";

export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.variant}`}>
          {toast.variant === "error" ? (
            <XIcon className="toast-icon" width={18} height={18} />
          ) : (
            <CheckIcon className="toast-icon" width={18} height={18} />
          )}
          <p className="toast-message">{toast.message}</p>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <XIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

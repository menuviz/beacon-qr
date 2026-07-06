"use client";

import { useEffect, useRef } from "react";
import { TrashIcon } from "./icons";

export default function ConfirmDialog({ open, message, confirmLabel = "Delete", onConfirm, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(event) {
    const dialog = dialogRef.current;
    const rect = dialog.getBoundingClientRect();
    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!clickedInside) {
      dialog.close();
    }
  }

  function handleConfirm() {
    onConfirm();
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal confirm-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {open ? (
        <div className="modal-content">
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="button" className="btn-destructive" onClick={handleConfirm}>
              <TrashIcon width={14} height={14} />
              {confirmLabel}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

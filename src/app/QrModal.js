/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { filenameFor } from "@/lib/beacon";
import { XIcon } from "./icons";

export default function QrModal({ code, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (code && !dialog.open) {
      dialog.showModal();
    } else if (!code && dialog.open) {
      dialog.close();
    }
  }, [code]);

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

  return (
    <dialog
      ref={dialogRef}
      className="modal qr-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {code ? (
        <div className="modal-content qr-modal-content">
          <button
            type="button"
            className="modal-close btn-icon btn-outline"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            <XIcon width={16} height={16} />
          </button>
          <img className="qr-modal-image" src={`/api/qr/${code.id}`} alt={`QR code ${code.id}`} />
          {code.label ? <p className="qr-modal-label">{code.label}</p> : null}
          <p className="eyebrow mono qr-modal-id">{code.id}</p>
          <a
            className="btn btn-secondary qr-modal-download"
            href={`/api/qr/${code.id}`}
            download={filenameFor(code)}
          >
            Download PNG
          </a>
        </div>
      ) : null}
    </dialog>
  );
}

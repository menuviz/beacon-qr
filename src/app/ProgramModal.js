"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QR_PROGRAMMED_CHANNEL } from "@/lib/beacon";
import { EyeIcon, EyeOffIcon, XIcon } from "./icons";

export default function ProgramModal({ code, action, onClose, onSuccess }) {
  const dialogRef = useRef(null);
  const passcodeRef = useRef(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const [showPasscode, setShowPasscode] = useState(false);
  const destination = state?.ok ? state.destination : code?.destination;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (code && !dialog.open) {
      dialog.showModal();
      // showModal()'s own focus-management runs synchronously here and would
      // otherwise win over React's `autoFocus` (which isn't a real DOM
      // `autofocus` attribute, so the dialog's native algorithm doesn't see
      // it and focuses the <dialog> itself instead).
      passcodeRef.current?.focus();
    } else if (!code && dialog.open) {
      dialog.close();
    }
  }, [code]);

  useEffect(() => {
    // `code` is also a dependency (it becomes null once the modal closes),
    // so this effect re-runs on close while `state.ok` is still true from the
    // prior submission — guard against acting on a null code at that point.
    if (!state?.ok || !code) {
      return;
    }

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(QR_PROGRAMMED_CHANNEL);
      channel.postMessage({ id: code.id });
      channel.close();
    }

    router.refresh();
    onSuccess?.();
    const timeout = setTimeout(() => dialogRef.current?.close(), 900);
    return () => clearTimeout(timeout);
    // `onSuccess` intentionally excluded: CodesTable passes a new arrow
    // function each render, and onSuccess itself triggers a toast state
    // update there — including it here would re-run this effect on every
    // resulting re-render, firing a duplicate toast/refresh each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router, code]);

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
      className="modal program-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {code ? (
        <div className="modal-content">
          <button
            type="button"
            className="modal-close btn-icon btn-outline"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            <XIcon width={16} height={16} />
          </button>
          <p className="eyebrow">Code {code.id}</p>
          <h2>{code.destination ? "Reprogram this Beacon" : "Program this blank Beacon"}</h2>

          {state?.ok ? (
            <div className="success">
              <strong>Saved.</strong> This code now points to{" "}
              <a href={destination} rel="noreferrer">
                {destination}
              </a>
              .
            </div>
          ) : null}

          {state && !state.ok ? <p className="form-error">{state.message}</p> : null}

          <form action={formAction} className="program-form">
            <label>
              Passcode
              <div className="password-field">
                <input
                  ref={passcodeRef}
                  name="passcode"
                  type={showPasscode ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasscode((value) => !value)}
                  aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                >
                  {showPasscode ? (
                    <EyeOffIcon width={14} height={14} />
                  ) : (
                    <EyeIcon width={14} height={14} />
                  )}
                </button>
              </div>
            </label>
            <label>
              Label
              <input
                name="label"
                type="text"
                defaultValue={code.label || ""}
                placeholder="Front counter card"
              />
            </label>
            <label>
              Destination URL
              <input
                name="destination"
                type="text"
                inputMode="url"
                defaultValue={destination || ""}
                placeholder="https://example.com"
                required
              />
            </label>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Saving..." : "Save destination"}
            </button>
          </form>
        </div>
      ) : null}
    </dialog>
  );
}

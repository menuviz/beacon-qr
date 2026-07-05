"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/beacon";
import { EditIcon, XIcon } from "./icons";

export default function AnalyticsModal({ codeId, getCodeAnalytics, onReprogram, onClose }) {
  const dialogRef = useRef(null);
  const [data, setData] = useState(null);
  // Starts true: this component remounts fresh per code (keyed by codeId in
  // CodesTable.js), so a mount with a codeId is always about to fetch.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (codeId && !dialog.open) {
      dialog.showModal();
    } else if (!codeId && dialog.open) {
      dialog.close();
    }
  }, [codeId]);

  useEffect(() => {
    if (!codeId) {
      return;
    }

    let cancelled = false;

    getCodeAnalytics(codeId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [codeId, getCodeAnalytics]);

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
      className="modal analytics-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {codeId ? (
        <div className="modal-content">
          <button
            type="button"
            className="modal-close btn-icon btn-outline"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            <XIcon width={16} height={16} />
          </button>

          {loading ? (
            <>
              <div className="skeleton-block skeleton-title" aria-hidden="true" />
              <div className="skeleton-block skeleton-heading" aria-hidden="true" />
              <div className="skeleton-metrics" aria-hidden="true">
                <div className="skeleton-block skeleton-metric" />
                <div className="skeleton-block skeleton-metric" />
                <div className="skeleton-block skeleton-metric" />
              </div>
              <div className="skeleton-block skeleton-panel" aria-hidden="true" />
              <div className="skeleton-block skeleton-panel" aria-hidden="true" />
              <p className="sr-only" role="status">
                Loading analytics...
              </p>
            </>
          ) : null}

          {!loading && !data ? (
            <>
              <p className="eyebrow">Analytics</p>
              <h2>Code not found</h2>
            </>
          ) : null}

          {!loading && data ? (
            <>
              <p className="eyebrow">Analytics / {codeId}</p>
              <h2>{data.code.label || data.code.id}</h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => onReprogram(data.code)}
              >
                <EditIcon width={14} height={14} />
                Reprogram
              </button>

              <section className="analytics-metrics">
                <div className="metric">
                  <span>{data.code.scan_count}</span>
                  <p>Total scans</p>
                </div>
                <div className="metric">
                  <span>{formatDate(data.firstScan)}</span>
                  <p>First scan</p>
                </div>
                <div className="metric">
                  <span>{formatDate(data.lastScan)}</span>
                  <p>Last scan</p>
                </div>
              </section>

              <div className="chart-panel">
                <h2>Last 14 days</h2>
                <div className="bar-chart">
                  {data.daily.map((day) => (
                    <div className="bar-slot" key={day.key}>
                      <span style={{ height: day.height }} title={`${day.count} scans`} />
                      <small>{day.label}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-panel">
                <h2>Top locations</h2>
                {data.locations.length ? (
                  <ul className="location-list">
                    {data.locations.map((location) => (
                      <li key={location.country}>
                        <span>{location.country}</span>
                        <strong>{location.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No country data has been reported yet.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QR_PROGRAMMED_CHANNEL, formatDate, truncateUrl } from "@/lib/beacon";
import {
  ChartIcon,
  CheckIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  PrinterIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "./icons";
import AnalyticsModal from "./AnalyticsModal";
import ConfirmDialog from "./ConfirmDialog";
import ProgramModal from "./ProgramModal";
import QrModal from "./QrModal";
import Toast from "./Toast";

let toastSeq = 0;

export default function CodesTable({
  codes,
  deleteCode,
  deleteCodes,
  programCode,
  getCodeAnalytics,
}) {
  const router = useRouter();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [viewingCode, setViewingCode] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [programmingCode, setProgrammingCode] = useState(null);
  const [programOpenToken, setProgramOpenToken] = useState(0);
  const [analyticsCodeId, setAnalyticsCodeId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toasts, setToasts] = useState([]);

  function pushToast(message, variant = "success") {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function handleCopyId(id) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      pushToast("Copied to clipboard");
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    });
  }

  function openProgramModal(code) {
    setProgrammingCode(code);
    setProgramOpenToken((token) => token + 1);
  }

  function handleReprogramFromAnalytics(code) {
    setAnalyticsCodeId(null);
    openProgramModal(code);
  }

  // The public /r/[id] scan flow (a field tech programming a code from their
  // own phone) has no direct channel back to this tab; ProgramForm broadcasts
  // on success there, and ProgramModal broadcasts here too for any other open
  // admin tab — refetch this route's data instead of polling.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(QR_PROGRAMMED_CHANNEL);
    channel.onmessage = () => router.refresh();
    return () => channel.close();
  }, [router]);

  // `selected` can briefly hold ids that no longer exist in `codes` (e.g. a row
  // was deleted individually while checked); derive the live subset for display
  // and for bulk actions instead of trusting `selected` directly.
  const activeSelected = useMemo(() => {
    const validIds = new Set(codes.map((code) => code.id));
    const next = new Set();
    for (const id of selected) {
      if (validIds.has(id)) {
        next.add(id);
      }
    }
    return next;
  }, [codes, selected]);

  const searchable = useMemo(
    () =>
      codes.map((code) => ({
        code,
        searchId: code.id.toLowerCase(),
        searchLabel: (code.label || "").toLowerCase(),
      })),
    [codes]
  );

  const filteredCodes = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return codes;
    }
    return searchable
      .filter((entry) => entry.searchId.includes(term) || entry.searchLabel.includes(term))
      .map((entry) => entry.code);
  }, [searchable, codes, query]);

  // Live codes first, then unprogrammed — preserving each group's existing
  // (created_at desc) order, since .filter() keeps relative order.
  const sortedCodes = useMemo(() => {
    const live = filteredCodes.filter((code) => code.destination);
    const blank = filteredCodes.filter((code) => !code.destination);
    return [...live, ...blank];
  }, [filteredCodes]);

  const allSelected =
    filteredCodes.length > 0 && filteredCodes.every((code) => activeSelected.has(code.id));

  function cancelSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of filteredCodes) {
        if (allSelected) {
          next.delete(code.id);
        } else {
          next.add(code.id);
        }
      }
      return next;
    });
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function requestDelete(id) {
    setConfirmTarget({
      kind: "single",
      ids: [id],
      message: `Delete code ${id} and all of its scan history? This cannot be undone.`,
    });
  }

  function requestBulkDelete() {
    const count = activeSelected.size;
    if (count === 0) {
      return;
    }

    setConfirmTarget({
      kind: "bulk",
      ids: Array.from(activeSelected),
      message: `Delete ${count} code${count === 1 ? "" : "s"} and all of their scan history? This cannot be undone.`,
    });
  }

  function handleConfirmDelete() {
    if (!confirmTarget) {
      return;
    }

    const { kind, ids } = confirmTarget;
    startTransition(async () => {
      if (kind === "single") {
        const formData = new FormData();
        formData.set("id", ids[0]);
        await deleteCode(formData);
        pushToast("QR code deleted");
      } else {
        await deleteCodes(ids);
        pushToast(`${ids.length} QR code${ids.length === 1 ? "" : "s"} deleted`);
        setSelected(new Set());
        setSelectMode(false);
      }
    });
  }

  return (
    <section className="table-wrap" aria-label="QR code inventory">
      <div className={`row-actions selection-toolbar${selectMode ? " active" : ""}`}>
        <div className="search-field">
          <SearchIcon className="search-field-icon" width={16} height={16} />
          <input
            type="search"
            className="search-input"
            placeholder="Search by ID or label..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search QR codes by ID or label"
          />
          {query ? (
            <button
              type="button"
              className="search-field-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <XIcon width={14} height={14} />
            </button>
          ) : null}
        </div>
        {selectMode ? (
          <>
            <button type="button" className="btn btn-sm btn-outline" onClick={toggleAll}>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <button type="button" className="btn btn-sm btn-outline" onClick={cancelSelectMode}>
              Cancel
            </button>
            <span className="selected-count">{activeSelected.size} selected</span>
            {activeSelected.size > 0 ? (
              <>
                <Link
                  href={`/print?ids=${Array.from(activeSelected).join(",")}`}
                  className="btn btn-sm btn-secondary"
                >
                  <PrinterIcon width={14} height={14} />
                  Print sheet
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-destructive"
                  onClick={requestBulkDelete}
                  disabled={isPending}
                >
                  <TrashIcon width={14} height={14} />
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : null}
          </>
        ) : (
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setSelectMode(true)}>
            Select
          </button>
        )}
      </div>

      <table>
        <thead>
          <tr>
            {selectMode ? <th /> : null}
            <th>ID</th>
            <th>Label</th>
            <th>Status</th>
            <th>Destination</th>
            <th>Scans</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedCodes.map((code) => (
            <tr key={code.id} className={activeSelected.has(code.id) ? "selected" : undefined}>
              {selectMode ? (
                <td>
                  <input
                    type="checkbox"
                    checked={activeSelected.has(code.id)}
                    onChange={() => toggleOne(code.id)}
                    aria-label={`Select code ${code.id}`}
                  />
                </td>
              ) : null}
              <td>
                <span className="id-cell">
                  <span className="mono">{code.id}</span>
                  <button
                    type="button"
                    className={`btn-icon btn-sm copy-id-button${copiedId === code.id ? " copied" : ""}`}
                    onClick={() => handleCopyId(code.id)}
                    aria-label={`Copy code ${code.id}`}
                  >
                    {copiedId === code.id ? (
                      <CheckIcon width={14} height={14} />
                    ) : (
                      <CopyIcon width={14} height={14} />
                    )}
                  </button>
                </span>
              </td>
              <td>{code.label || code.id}</td>
              <td>
                <span className={code.destination ? "badge live" : "badge blank"}>
                  {code.destination ? "Live" : "Available"}
                </span>
              </td>
              <td title={code.destination || ""}>{truncateUrl(code.destination)}</td>
              <td className="mono">{code.scan_count}</td>
              <td>{formatDate(code.created_at)}</td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => openProgramModal(code)}
                  >
                    <EditIcon width={14} height={14} />
                    Program
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setAnalyticsCodeId(code.id)}
                  >
                    <ChartIcon width={14} height={14} />
                    Analytics
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setViewingCode(code)}
                  >
                    <EyeIcon width={14} height={14} />
                    View
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-destructive"
                    onClick={() => requestDelete(code.id)}
                  >
                    <TrashIcon width={14} height={14} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredCodes.length === 0 ? (
        <div className="empty">
          {codes.length === 0 ? (
            <>
              <strong>No QR codes yet</strong>
              <p>Generate a batch of blank codes to get started — you can assign destinations later.</p>
            </>
          ) : (
            <>
              <SearchIcon className="empty-icon" width={28} height={28} />
              <strong>No matches found</strong>
              <p>No codes match &ldquo;{query.trim()}&rdquo;. Try a different ID or label.</p>
            </>
          )}
        </div>
      ) : null}
      <QrModal code={viewingCode} onClose={() => setViewingCode(null)} />
      <ProgramModal
        key={programOpenToken}
        code={programmingCode}
        action={programCode.bind(null, programmingCode?.id)}
        onClose={() => setProgrammingCode(null)}
        onSuccess={() => pushToast("QR programmed successfully")}
      />
      <ConfirmDialog
        open={!!confirmTarget}
        message={confirmTarget?.message}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmTarget(null)}
      />
      <AnalyticsModal
        key={analyticsCodeId || "none"}
        codeId={analyticsCodeId}
        getCodeAnalytics={getCodeAnalytics}
        onReprogram={handleReprogramFromAnalytics}
        onClose={() => setAnalyticsCodeId(null)}
      />
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </section>
  );
}

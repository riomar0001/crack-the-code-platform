"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

type RulesModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called once the reader has scrolled to the end and confirmed. */
  onAccept: () => void;
  /** The documents to read. Only mounted while the modal is open. */
  children: ReactNode;
};

/** How close to the bottom counts as "reached the end", in px. */
const END_SLACK = 24;

/**
 * Modal that makes the reader get to the end of a document before they can
 * confirm. It is a native <dialog>, so focus is trapped, Esc closes it and
 * everything behind it is inert without any extra code.
 */
export function RulesModal({ open, onClose, onAccept, children }: RulesModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [progress, setProgress] = useState(0);
  // Kept across opens: someone who already read to the end can reopen it and
  // confirm straight away.
  const [reachedEnd, setReachedEnd] = useState(false);

  const measure = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const max = scroller.scrollHeight - scroller.clientHeight;

    // Nothing to scroll (a tall screen, short text): it is all already on show.
    setProgress(max <= 0 ? 1 : Math.min(1, scroller.scrollTop / max));
    if (max - scroller.scrollTop <= END_SLACK) setReachedEnd(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) dialog.showModal();

    // Measure once the content has laid out, and again if it reflows (a
    // rotated phone, a resized window).
    const frame = requestAnimationFrame(measure);
    const scroller = scrollRef.current;
    const observer = scroller ? new ResizeObserver(measure) : null;
    if (scroller) observer?.observe(scroller);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [open, measure]);

  return (
    <dialog
      ref={dialogRef}
      className="ctc-modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ctc-modal-head">
        <div>
          <div className="ctc-modal-eyebrow">BEFORE YOU ENLIST</div>
          <h2 id={titleId}>Rules &amp; Code of Conduct</h2>
        </div>

        <button type="button" className="ctc-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div
        ref={scrollRef}
        className="ctc-modal-body"
        role="region"
        aria-label="Rules and Code of Conduct"
        tabIndex={0}
        onScroll={measure}
      >
        {open ? children : null}
      </div>

      <div className="ctc-modal-foot">
        <div className="ctc-modal-progress">
          <div className="ctc-modal-progress-bar" aria-hidden>
            <span style={{ width: `${Math.round((reachedEnd ? 1 : progress) * 100)}%` }} />
          </div>
          <div role="status" aria-live="polite">
            {reachedEnd
              ? "You have reached the end."
              : "Scroll to the end of both documents to continue."}
          </div>
        </div>

        <div className="ctc-modal-actions">
          <button type="button" className="ctc-btn-quiet ctc-slant-8" onClick={onClose}>
            CANCEL
          </button>
          <button
            type="button"
            className="ctc-btn ctc-btn--primary ctc-btn--md ctc-slant-12"
            disabled={!reachedEnd}
            onClick={onAccept}
          >
            I HAVE READ AND AGREE
          </button>
        </div>
      </div>
    </dialog>
  );
}

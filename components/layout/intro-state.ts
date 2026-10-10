/**
 * Bookkeeping for the intro curtain, kept at module level so it lives exactly
 * as long as the document: it survives client-side route changes (going back
 * to the home page must not replay the curtain) and resets on a real load or
 * refresh (which plays it again, once).
 */

/** Delay + duration of the curtain's wipe in `styles/reveal.css`, plus slack. */
const CURTAIN_DURATION_MS = 970 + 650 + 80;

let firstSeenAt: number | null = null;

/** Whether the curtain was already shown on this page load. */
export const hasSeenIntro = () => firstSeenAt !== null;

/** Whether the curtain was shown long enough ago that its animation is over. */
export const introHasFinished = () =>
  firstSeenAt !== null && Date.now() - firstSeenAt >= CURTAIN_DURATION_MS;

/** Record that the visitor has arrived; only the first call counts. */
export const markIntroSeen = () => {
  firstSeenAt ??= Date.now();
};

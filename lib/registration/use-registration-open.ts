"use client";

import { useSyncExternalStore } from "react";

import { isRegistrationOpen } from "@/lib/registration/window";

/** Re-check often enough that the interface flips close to the deadline. */
const CHECK_EVERY_MS = 15_000;

const subscribe = (onChange: () => void) => {
  const timer = window.setInterval(onChange, CHECK_EVERY_MS);
  return () => window.clearInterval(timer);
};

/**
 * Whether registration is still open, from the visitor's clock.
 *
 * The server snapshot is always "open", matching the statically generated
 * HTML, so hydration never mismatches; a visitor after the deadline sees it
 * flip as soon as the page is interactive. This is presentation only: the
 * server actions enforce the real deadline.
 */
export function useRegistrationOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isRegistrationOpen(),
    () => true,
  );
}

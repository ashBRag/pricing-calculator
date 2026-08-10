"use client";

import { useEffect } from "react";

/**
 * Render-hosted backends sleep after ~15min of inactivity. Fires a single,
 * fire-and-forget GET on first mount to start waking it up without blocking
 * or delaying the page.
 */
export function BackendPing() {
  useEffect(() => {
    fetch("/api/backend/health").catch(() => {});
  }, []);

  return null;
}

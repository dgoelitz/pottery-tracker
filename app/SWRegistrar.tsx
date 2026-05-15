"use client";

import { useEffect } from "react";

export function SWRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      })
      .catch((error) => {
        console.error("Service Worker cleanup failed:", error);
      });
  }, []);

  return null;
}

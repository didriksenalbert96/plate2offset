"use client";

import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function handleOnline() { setOffline(false); }
    function handleOffline() { setOffline(true); }

    setOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
      You&apos;re offline — meals will be queued and analyzed when you reconnect
    </div>
  );
}

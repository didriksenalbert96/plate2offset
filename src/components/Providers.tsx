"use client";

import { type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/supabase/auth-context";
import { useSync } from "@/lib/supabase/sync";
import { migrateToSupabase, hasMigrated } from "@/lib/supabase/migration";
import { useEffect } from "react";

function SyncManager() {
  const { user } = useAuth();
  useSync(user);

  // Run migration on first sign-in
  useEffect(() => {
    if (user && !hasMigrated()) {
      migrateToSupabase(user.id).catch(() => {});
    }
  }, [user]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SyncManager />
      {children}
    </AuthProvider>
  );
}

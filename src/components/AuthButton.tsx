"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);

  useEffect(() => {
    // Check if Supabase env vars are configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }

    setSupabaseAvailable(true);

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      setUser(res.data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't render anything if Supabase isn't configured or still loading
  if (!supabaseAvailable || loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
          {user.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <button
          onClick={async () => {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.signOut();
            setUser(null);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition"
    >
      Sign in
    </Link>
  );
}

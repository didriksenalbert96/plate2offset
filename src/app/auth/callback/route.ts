/**
 * Auth callback route — exchanges the auth code for a session.
 *
 * Handles both magic link and OAuth redirects from Supabase.
 */

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to home after successful sign-in
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If something went wrong, redirect to auth page
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}

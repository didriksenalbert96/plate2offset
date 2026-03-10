"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  getGroupMembers,
  getGroupLeaderboard,
  getGroupStats,
  leaveGroup,
  type GroupMember,
  type GroupLeaderboardEntry,
  type GroupStats,
} from "@/lib/groups";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import GroupJar from "@/components/GroupJar";
import Leaderboard from "@/components/Leaderboard";

interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<GroupLeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !groupId) return;

    setLoading(true);

    // Fetch group info
    const supabase = getSupabaseBrowserClient();
    const { data: groupData } = await supabase
      .from("groups")
      .select("id, name, invite_code")
      .eq("id", groupId)
      .single();

    if (groupData) {
      setGroup(groupData as GroupInfo);
    }

    // Fetch all data in parallel
    const [membersData, leaderboardData, statsData] = await Promise.all([
      getGroupMembers(groupId),
      getGroupLeaderboard(groupId),
      getGroupStats(groupId),
    ]);

    setMembers(membersData);
    setLeaderboard(leaderboardData);
    setStats(statsData);
    setLoading(false);
  }, [user, groupId]);

  useEffect(() => {
    if (user) loadData();
    else setLoading(false);
  }, [user, loadData]);

  async function handleLeave() {
    if (!user) return;
    const success = await leaveGroup(groupId, user.id);
    if (success) {
      window.location.href = "/groups";
    }
  }

  function handleCopyCode() {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code).catch(() => {});
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-400 mt-2">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4">
        <div className="text-center space-y-4">
          <p className="text-stone-500">Group not found.</p>
          <Link href="/groups" className="text-emerald-600 underline text-sm">
            &larr; Back to groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-8">
      <main className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/groups" className="text-sm text-stone-500 hover:text-stone-700">
            &larr; Groups
          </Link>
          <h1 className="text-xl font-bold text-stone-900 truncate px-2">{group.name}</h1>
          <div className="w-12" />
        </div>

        {/* Group jar */}
        {stats && (
          <GroupJar
            jarCents={stats.jar_cents}
            memberCount={stats.member_count}
            totalMeals={stats.total_meals}
          />
        )}

        {/* Leaderboard */}
        {user && (
          <Leaderboard entries={leaderboard} currentUserId={user.id} />
        )}

        {/* Members list */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-stone-700">
            Members ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                    {(m.display_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <span className={m.user_id === user?.id ? "font-medium text-emerald-700" : "text-stone-700"}>
                    {m.display_name || (m.user_id === user?.id ? "You" : "Member")}
                  </span>
                </div>
                {m.role === "admin" && (
                  <span className="text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite code */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-stone-700">Invite others</h3>
          <p className="text-xs text-stone-400">
            Share this code so others can join your group.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteCode(!showInviteCode)}
              className="flex-1 rounded-xl bg-stone-50 px-4 py-3 text-center font-mono text-lg tracking-widest text-stone-700 hover:bg-stone-100 transition"
            >
              {showInviteCode ? group.invite_code : "Tap to reveal"}
            </button>
            {showInviteCode && (
              <button
                onClick={handleCopyCode}
                className="rounded-xl bg-emerald-50 px-3 py-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Leave group */}
        <div className="pt-2">
          {confirmLeave ? (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200 space-y-3 text-center">
              <p className="text-sm text-red-800">Leave this group?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleLeave}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Leave
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-full text-center text-sm text-stone-400 underline underline-offset-2 hover:text-red-500"
            >
              Leave group
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { getUserGroups, createGroup, type Group } from "@/lib/groups";
import JoinGroupModal from "@/components/JoinGroupModal";

export default function GroupsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const userGroups = await getUserGroups(user.id);
    setGroups(userGroups);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadGroups();
    else setLoading(false);
  }, [user, loadGroups]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;

    setCreating(true);
    const group = await createGroup(newGroupName.trim(), user.id);
    setCreating(false);

    if (group) {
      setNewGroupName("");
      setShowCreateForm(false);
      await loadGroups();
    }
  }

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
        <main className="w-full max-w-md text-center space-y-6">
          <h1 className="text-2xl font-bold text-stone-900">Groups</h1>
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p className="text-stone-500">Sign in to create or join groups.</p>
            <p className="text-sm text-stone-400">
              Groups let you offset meals together with family and friends.
            </p>
          </div>
          <Link
            href="/auth"
            className="inline-block rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Sign in
          </Link>
          <div>
            <Link href="/" className="text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600">
              &larr; Back to app
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-8">
      <main className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold text-stone-900">Groups</h1>
          <div className="w-12" />
        </div>

        {/* Loading */}
        {(authLoading || loading) && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-stone-400 mt-2">Loading...</p>
          </div>
        )}

        {/* Group list */}
        {!authLoading && !loading && (
          <>
            {groups.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 text-center space-y-3">
                <p className="text-stone-500">No groups yet.</p>
                <p className="text-sm text-stone-400">
                  Create a group or join one with an invite code.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 hover:ring-emerald-300 transition"
                  >
                    <p className="text-sm font-semibold text-stone-900">{group.name}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Code: <span className="font-mono">{group.invite_code}</span>
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {showCreateForm ? (
                <form onSubmit={handleCreate} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-3">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name (e.g. The Smiths)"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={creating || !newGroupName.trim()}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Create a group
                </button>
              )}

              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full rounded-full border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                Join with invite code
              </button>
            </div>
          </>
        )}

        {/* Join modal */}
        {showJoinModal && user && (
          <JoinGroupModal
            userId={user.id}
            onJoined={() => {
              setShowJoinModal(false);
              loadGroups();
            }}
            onClose={() => setShowJoinModal(false)}
          />
        )}
      </main>
    </div>
  );
}

"use client";

/**
 * JoinGroupModal — enter invite code to join a group.
 */

import { useState } from "react";
import { joinGroup } from "@/lib/groups";

interface JoinGroupModalProps {
  userId: string;
  onJoined: () => void;
  onClose: () => void;
}

export default function JoinGroupModal({ userId, onJoined, onClose }: JoinGroupModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    const group = await joinGroup(code, userId);
    setLoading(false);

    if (group) {
      onJoined();
    } else {
      setError("Invalid invite code. Check the code and try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Join a group</h2>
        <p className="text-sm text-stone-500">
          Enter the invite code shared by the group admin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. abc12345"
            className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join group"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

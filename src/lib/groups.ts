/**
 * Groups — CRUD operations for household/friend groups.
 *
 * Groups require authentication (Supabase). All operations use the
 * browser Supabase client and are async.
 */

import { getSupabaseBrowserClient } from "./supabase/client";

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  display_name: string | null;
}

export interface GroupLeaderboardEntry {
  user_id: string;
  display_name: string | null;
  total_meals: number;
  total_offset_cents: number;
}

export interface GroupStats {
  total_meals: number;
  total_offset_cents: number;
  member_count: number;
  last_donation_at: string | null;
  jar_cents: number;
}

/**
 * Create a new group. The creator is automatically added as admin.
 */
export async function createGroup(name: string, userId: string): Promise<Group | null> {
  const supabase = getSupabaseBrowserClient();

  // Generate a short invite code
  const inviteCode = generateInviteCode();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, invite_code: inviteCode, created_by: userId })
    .select()
    .single();

  if (groupError || !group) {
    return null;
  }

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "admin" });

  if (memberError) {
    // Creator membership failed — group was still created
  }

  return group as Group;
}

/**
 * Join a group by invite code.
 */
export async function joinGroup(inviteCode: string, userId: string): Promise<Group | null> {
  const supabase = getSupabaseBrowserClient();

  // Find the group
  const { data: group, error: findError } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode.trim().toLowerCase())
    .single();

  if (findError || !group) {
    return null;
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return group as Group; // Already a member
  }

  // Join
  const { error: joinError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "member" });

  if (joinError) {
    return null;
  }

  return group as Group;
}

/**
 * Leave a group.
 */
export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Get all groups the current user belongs to.
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: memberships, error: memberError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (memberError || !memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m: { group_id: string }) => m.group_id);

  const { data: groups, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds);

  if (groupError || !groups) return [];

  return groups as Group[];
}

/**
 * Get members of a group with their display names.
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      group_id,
      user_id,
      role,
      joined_at,
      profiles ( display_name )
    `)
    .eq("group_id", groupId);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    group_id: row.group_id as string,
    user_id: row.user_id as string,
    role: row.role as "admin" | "member",
    joined_at: row.joined_at as string,
    display_name: (row.profiles as { display_name: string | null } | null)?.display_name ?? null,
  }));
}

/**
 * Get leaderboard — aggregate offset per member in a group.
 */
export async function getGroupLeaderboard(groupId: string): Promise<GroupLeaderboardEntry[]> {
  const supabase = getSupabaseBrowserClient();

  // Get member IDs
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (!members || members.length === 0) return [];

  const memberIds = members.map((m: { user_id: string }) => m.user_id);

  // Get aggregate meal data for each member
  const { data: meals } = await supabase
    .from("meals")
    .select("user_id, offset_cents")
    .in("user_id", memberIds);

  if (!meals) return [];

  // Get profiles for display names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", memberIds);

  const profileMap = new Map<string, string | null>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id as string, p.display_name as string | null);
    }
  }

  // Aggregate
  const agg = new Map<string, { meals: number; cents: number }>();
  for (const m of meals) {
    const uid = m.user_id as string;
    const existing = agg.get(uid) ?? { meals: 0, cents: 0 };
    existing.meals += 1;
    existing.cents += (m.offset_cents as number) ?? 0;
    agg.set(uid, existing);
  }

  const results: GroupLeaderboardEntry[] = [];
  for (const uid of memberIds) {
    const data = agg.get(uid) ?? { meals: 0, cents: 0 };
    results.push({
      user_id: uid,
      display_name: profileMap.get(uid) ?? null,
      total_meals: data.meals,
      total_offset_cents: data.cents,
    });
  }

  return results.sort((a, b) => b.total_offset_cents - a.total_offset_cents);
}

/**
 * Get group stats — combined jar total, member count, etc.
 */
export async function getGroupStats(groupId: string): Promise<GroupStats> {
  const supabase = getSupabaseBrowserClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (!members || members.length === 0) {
    return { total_meals: 0, total_offset_cents: 0, member_count: 0, last_donation_at: null, jar_cents: 0 };
  }

  const memberIds = members.map((m: { user_id: string }) => m.user_id);

  // Total meals + offset
  const { data: meals } = await supabase
    .from("meals")
    .select("offset_cents, logged_at")
    .in("user_id", memberIds);

  const totalMeals = meals?.length ?? 0;
  const totalCents = meals?.reduce((s: number, m: { offset_cents: number }) => s + m.offset_cents, 0) ?? 0;

  // Last group donation (any member's most recent donation)
  const { data: lastDonation } = await supabase
    .from("donations")
    .select("donated_at")
    .in("user_id", memberIds)
    .order("donated_at", { ascending: false })
    .limit(1);

  const lastDonationAt = lastDonation?.[0]?.donated_at as string | null ?? null;

  // Jar = meals since last donation
  let jarCents = totalCents;
  if (lastDonationAt && meals) {
    jarCents = meals
      .filter((m: { logged_at: string }) => m.logged_at > lastDonationAt)
      .reduce((s: number, m: { offset_cents: number }) => s + m.offset_cents, 0);
  }

  return {
    total_meals: totalMeals,
    total_offset_cents: totalCents,
    member_count: members.length,
    last_donation_at: lastDonationAt,
    jar_cents: jarCents,
  };
}

function generateInviteCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

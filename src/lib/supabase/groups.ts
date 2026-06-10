/**
 * Accès aux groupes, membres et passages partagés (Supabase).
 */
import { supabase } from '@/lib/supabase/client';

export type Group = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

export type GroupSession = {
  id: string;
  group_id: string;
  title: string;
  book: number;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  note: string | null;
  scheduled_date: string | null;
  created_at: string;
};

export type MemberWithName = {
  user_id: string;
  role: 'admin' | 'member';
  display_name: string | null;
};

export async function getMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from('groups').select('*').order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getGroup(id: string): Promise<Group | null> {
  const { data, error } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createGroup(name: string, description?: string): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', {
    p_name: name,
    p_description: description ?? null,
  });
  if (error) throw error;
  return data as Group;
}

export async function joinGroup(code: string): Promise<Group> {
  const { data, error } = await supabase.rpc('join_group', { p_code: code });
  if (error) throw error;
  return data as Group;
}

export async function leaveGroup(groupId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Non connecté');
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', uid);
  if (error) throw error;
}

export async function getMembers(groupId: string): Promise<MemberWithName[]> {
  const { data: members, error } = await supabase
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', groupId);
  if (error) throw error;
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids);
  if (pErr) throw pErr;
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string | null]));
  return (members ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role as 'admin' | 'member',
    display_name: nameById.get(m.user_id) ?? null,
  }));
}

export async function getGroupSessions(groupId: string): Promise<GroupSession[]> {
  const { data, error } = await supabase
    .from('group_sessions')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type SessionWithGroup = GroupSession & { groups: { name: string } | null };

/** Toutes les sessions de mes groupes (pour l'onglet Plans). */
export async function getAllMySessions(): Promise<SessionWithGroup[]> {
  const { data, error } = await supabase
    .from('group_sessions')
    .select('*, groups(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SessionWithGroup[];
}

export async function createSession(input: {
  groupId: string;
  title: string;
  book: number;
  chapter: number;
  verseStart?: number | null;
  verseEnd?: number | null;
  note?: string | null;
  date?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('group_sessions').insert({
    group_id: input.groupId,
    title: input.title,
    book: input.book,
    chapter: input.chapter,
    verse_start: input.verseStart ?? null,
    verse_end: input.verseEnd ?? null,
    note: input.note ?? null,
    scheduled_date: input.date ?? null,
  });
  if (error) throw error;
}

export async function updateSession(
  id: string,
  input: {
    title: string;
    book: number;
    chapter: number;
    verseStart?: number | null;
    verseEnd?: number | null;
    note?: string | null;
    date?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('group_sessions')
    .update({
      title: input.title,
      book: input.book,
      chapter: input.chapter,
      verse_start: input.verseStart ?? null,
      verse_end: input.verseEnd ?? null,
      note: input.note ?? null,
      scheduled_date: input.date ?? null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('group_sessions').delete().eq('id', id);
  if (error) throw error;
}

export function isGroupAdmin(group: Group, userId: string | undefined): boolean {
  return !!userId && group.owner_id === userId;
}

export async function getSession(id: string): Promise<GroupSession | null> {
  const { data, error } = await supabase
    .from('group_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string | null;
};

export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, user_id, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const names = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', ids);
    for (const p of profiles ?? []) names.set(p.id, p.display_name as string | null);
  }
  return rows.map((r) => ({ ...r, display_name: names.get(r.user_id) ?? null }));
}

export async function sendMessage(
  groupId: string,
  sessionId: string,
  content: string,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Non connecté');
  const { error } = await supabase.from('messages').insert({
    group_id: groupId,
    session_id: sessionId,
    user_id: uid,
    content: content.trim(),
  });
  if (error) throw error;
}

/** Abonnement temps réel aux nouveaux messages d'un passage. */
export function subscribeMessages(sessionId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`messages-${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

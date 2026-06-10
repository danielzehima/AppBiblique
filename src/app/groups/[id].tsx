import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getBooks, type BookRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';
import {
  createSession,
  getGroup,
  getGroupSessions,
  getMembers,
  isGroupAdmin,
  leaveGroup,
  type Group,
  type GroupSession,
  type MemberWithName,
} from '@/lib/supabase/groups';
import { useAuth } from '@/store/auth';

export default function GroupDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberWithName[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getBooks().then(setBooks).catch(() => {});
  }, []);

  const reload = useCallback(() => {
    if (!id) return;
    Promise.all([getGroup(id), getMembers(id), getGroupSessions(id)])
      .then(([g, m, s]) => {
        setGroup(g);
        setMembers(m);
        setSessions(s);
      })
      .catch((e) => console.error('group detail', e));
  }, [id]);

  useFocusEffect(reload);

  const admin = group ? isGroupAdmin(group, user?.id) : false;
  const bookName = (nr: number) => books.find((b) => b.nr === nr)?.name ?? `Livre ${nr}`;

  const openSession = (s: GroupSession) =>
    router.push({
      pathname: '/read/[book]/[chapter]',
      params: { book: s.book, chapter: s.chapter, ...(s.verse_start ? { v: s.verse_start } : {}) },
    });

  const share = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Rejoins mon groupe "${group.name}" sur Demeure avec le code : ${group.invite_code}`,
      });
    } catch {
      /* annulé */
    }
  };

  const onLeave = async () => {
    if (!id) return;
    try {
      await leaveGroup(id);
      router.back();
    } catch (e) {
      console.error('leave', e);
    }
  };

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <ActivityIndicator color={theme.tint} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: group.name }} />
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        {group.description ? (
          <ThemedText themeColor="textSecondary">{group.description}</ThemedText>
        ) : null}

        {/* Code d'invitation */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold" themeColor="tint">CODE D’INVITATION</ThemedText>
          <View style={styles.codeRow}>
            <ThemedText type="title" style={{ letterSpacing: 4 }}>
              {group.invite_code}
            </ThemedText>
            <Pressable onPress={share} hitSlop={8} style={[styles.shareBtn, { borderColor: theme.tint }]}>
              <Ionicons name="share-social" size={18} color={theme.tint} />
              <ThemedText themeColor="tint" type="smallBold">Partager</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Passages / sessions */}
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" themeColor="tint">PASSAGES</ThemedText>
          {admin && (
            <Pressable onPress={() => setAddOpen(true)} hitSlop={8} style={styles.addBtn}>
              <Ionicons name="add-circle" size={20} color={theme.tint} />
              <ThemedText themeColor="tint" type="smallBold">Ajouter</ThemedText>
            </Pressable>
          )}
        </View>
        {sessions.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="small">
            Aucun passage défini{admin ? '. Ajoute le passage de la semaine.' : ' pour l’instant.'}
          </ThemedText>
        ) : (
          sessions.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => openSession(s)}
              style={({ pressed }) => [
                styles.sessionRow,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                i === 0 && { borderColor: theme.tint, borderWidth: 1 },
              ]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{s.title}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {bookName(s.book)} {s.chapter}
                  {s.verse_start ? `:${s.verse_start}${s.verse_end ? `-${s.verse_end}` : ''}` : ''}
                  {i === 0 ? '  · cette semaine' : ''}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          ))
        )}

        {/* Membres */}
        <ThemedText type="smallBold" themeColor="tint" style={{ marginTop: Spacing.four }}>
          MEMBRES ({members.length})
        </ThemedText>
        {members.map((m) => (
          <View key={m.user_id} style={[styles.memberRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="person-circle-outline" size={24} color={theme.textSecondary} />
            <ThemedText style={{ flex: 1 }}>{m.display_name ?? 'Membre'}</ThemedText>
            {m.role === 'admin' && (
              <View style={[styles.badge, { backgroundColor: theme.tint }]}>
                <ThemedText style={styles.badgeText}>Admin</ThemedText>
              </View>
            )}
          </View>
        ))}

        <Pressable onPress={onLeave} style={[styles.leaveBtn, { borderColor: theme.border }]}>
          <Ionicons name="exit-outline" size={18} color="#C0492F" />
          <ThemedText style={{ color: '#C0492F' }}>Quitter le groupe</ThemedText>
        </Pressable>
      </ScrollView>

      {addOpen && (
        <AddSessionModal
          books={books}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            reload();
          }}
          groupId={group.id}
        />
      )}
    </>
  );
}

function AddSessionModal({
  books,
  groupId,
  onClose,
  onSaved,
}: {
  books: BookRow[];
  groupId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [book, setBook] = useState<BookRow | null>(null);
  const [chapter, setChapter] = useState('');
  const [vStart, setVStart] = useState('');
  const [vEnd, setVEnd] = useState('');
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const ch = Number(chapter);
    if (!title.trim()) return setError('Donne un titre.');
    if (!book) return setError('Choisis un livre.');
    if (!ch || ch < 1 || ch > book.chapter_count) return setError('Chapitre invalide.');
    setBusy(true);
    try {
      await createSession({
        groupId,
        title: title.trim(),
        book: book.nr,
        chapter: ch,
        verseStart: vStart ? Number(vStart) : null,
        verseEnd: vEnd ? Number(vEnd) : null,
        note: note.trim() || null,
      });
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <ThemedText type="smallBold">Ajouter un passage</ThemedText>
        <TextInput value={title} onChangeText={setTitle} placeholder="Titre (ex. Étude de la semaine)" placeholderTextColor={theme.textSecondary} style={inputStyle} />
        <Pressable onPress={() => setPickerOpen(true)} style={[inputStyle, styles.pickerBtn]}>
          <ThemedText style={{ color: book ? theme.text : theme.textSecondary }}>
            {book ? book.name : 'Choisir un livre'}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <TextInput value={chapter} onChangeText={setChapter} placeholder="Chapitre" placeholderTextColor={theme.textSecondary} keyboardType="number-pad" style={[inputStyle, { flex: 1 }]} />
          <TextInput value={vStart} onChangeText={setVStart} placeholder="V. début" placeholderTextColor={theme.textSecondary} keyboardType="number-pad" style={[inputStyle, { flex: 1 }]} />
          <TextInput value={vEnd} onChangeText={setVEnd} placeholder="V. fin" placeholderTextColor={theme.textSecondary} keyboardType="number-pad" style={[inputStyle, { flex: 1 }]} />
        </View>
        <TextInput value={note} onChangeText={setNote} placeholder="Note pour le groupe (optionnel)" placeholderTextColor={theme.textSecondary} style={inputStyle} />
        {error && <ThemedText type="small" style={{ color: '#C0492F' }}>{error}</ThemedText>}
        <Pressable onPress={submit} disabled={busy} style={[styles.primary, { backgroundColor: theme.tint, opacity: busy ? 0.7 : 1 }]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.primaryText}>Publier</ThemedText>}
        </Pressable>
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />
        <View style={[styles.pickerSheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>Choisir un livre</ThemedText>
          <ScrollView>
            {books.map((b) => (
              <Pressable
                key={b.nr}
                onPress={() => {
                  setBook(b);
                  setPickerOpen(false);
                }}
                style={({ pressed }) => [styles.pickerItem, { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 }]}>
                <ThemedText>{b.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  card: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two, marginVertical: Spacing.two },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.three, marginBottom: Spacing.one },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.two, marginBottom: Spacing.two },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  badge: { borderRadius: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.three, borderRadius: Spacing.two, borderWidth: StyleSheet.hairlineWidth, marginTop: Spacing.five },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: Spacing.four, borderTopRightRadius: Spacing.four, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.four, gap: Spacing.three },
  pickerSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '70%', borderTopLeftRadius: Spacing.four, borderTopRightRadius: Spacing.four, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.four },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerItem: { paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { minHeight: 48, borderRadius: Spacing.two, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16, justifyContent: 'center' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Spacing.two },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

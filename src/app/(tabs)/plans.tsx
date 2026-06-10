import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatDate } from '@/components/calendar-modal';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getBooks, type BookRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';
import { getAllMySessions, type SessionWithGroup } from '@/lib/supabase/groups';
import { useAuth } from '@/store/auth';

export default function PlansScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [sessions, setSessions] = useState<SessionWithGroup[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBooks().then(setBooks).catch(() => {});
  }, []);

  const reload = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getAllMySessions()
      .then(setSessions)
      .catch((e) => console.error('getAllMySessions', e))
      .finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(reload);

  const bookName = (nr: number) => books.find((b) => b.nr === nr)?.name ?? `Livre ${nr}`;

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="calendar-outline" size={48} color={theme.tint} />
        <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
          Plans d’étude
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Connecte-toi et rejoins un groupe pour suivre le passage de la semaine.
        </ThemedText>
        <Pressable onPress={() => router.push('/auth')} style={[styles.primary, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.primaryText}>Se connecter</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      {loading && sessions.length === 0 ? (
        <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
      ) : sessions.length === 0 ? (
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          Aucun passage pour l’instant. Rejoins un groupe (onglet Groupes) ou demande à
          l’animateur d’en publier un.
        </ThemedText>
      ) : (
        sessions.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push({ pathname: '/groups/session/[id]', params: { id: s.id } })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <View style={[styles.icon, { backgroundColor: theme.tint }]}>
              <Ionicons name="book" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{s.title}</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                {bookName(s.book)} {s.chapter}
                {s.verse_start ? `:${s.verse_start}${s.verse_end ? `-${s.verse_end}` : ''}` : ''}
                {s.groups?.name ? `  ·  ${s.groups.name}` : ''}
                {s.scheduled_date ? `  ·  ${formatDate(s.scheduled_date)}` : ''}
              </ThemedText>
              {s.note ? (
                <ThemedText themeColor="textSecondary" type="small" numberOfLines={2} style={{ marginTop: 2 }}>
                  {s.note}
                </ThemedText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.three },
  content: { padding: Spacing.three, gap: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.five, paddingHorizontal: Spacing.four },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Spacing.three },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primary: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.five, borderRadius: Spacing.two },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getBooks } from '@/db/bible';
import { getAllBookmarks, getAllNotes, type BookmarkItem, type NoteItem } from '@/db/study';
import { useTheme } from '@/hooks/use-theme';

export default function AnnotationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [names, setNames] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [books, n, b] = await Promise.all([getBooks(), getAllNotes(), getAllBookmarks()]);
        if (!active) return;
        const map: Record<number, string> = {};
        for (const bk of books) map[bk.nr] = bk.name;
        setNames(map);
        setNotes(n);
        setBookmarks(b);
      })().catch((e) => console.error('annotations', e));
      return () => {
        active = false;
      };
    }, []),
  );

  const goTo = (book: number, chapter: number, verse: number) =>
    router.push({ pathname: '/read/[book]/[chapter]', params: { book, chapter, v: verse } });

  const ref = (book: number, chapter: number, verse: number) =>
    `${names[book] ?? ''} ${chapter}:${verse}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Notes & marque-pages' }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{
          padding: Spacing.three,
          paddingBottom: insets.bottom + Spacing.six,
        }}>
        <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
          MARQUE-PAGES
        </ThemedText>
        {bookmarks.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="small" style={styles.empty}>
            Aucun marque-page pour l’instant.
          </ThemedText>
        ) : (
          bookmarks.map((b) => (
            <Pressable
              key={`b-${b.book}-${b.chapter}-${b.verse}`}
              onPress={() => goTo(b.book, b.chapter, b.verse)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Ionicons name="bookmark" size={18} color={theme.tint} />
              <ThemedText>{ref(b.book, b.chapter, b.verse)}</ThemedText>
            </Pressable>
          ))
        )}

        <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
          NOTES
        </ThemedText>
        {notes.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="small" style={styles.empty}>
            Aucune note pour l’instant. Touche un verset pour en écrire une.
          </ThemedText>
        ) : (
          notes.map((n) => (
            <Pressable
              key={`n-${n.book}-${n.chapter}-${n.verse}`}
              onPress={() => goTo(n.book, n.chapter, n.verse)}
              style={({ pressed }) => [
                styles.noteCard,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold" themeColor="tint">
                {ref(n.book, n.chapter, n.verse)}
              </ThemedText>
              <ThemedText themeColor="textSecondary" numberOfLines={3}>
                {n.content}
              </ThemedText>
            </Pressable>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    letterSpacing: 1,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteCard: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.one,
  },
});

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getBook, type BookRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';

export default function ChaptersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookNr = Number(book);
  const [meta, setMeta] = useState<BookRow | null>(null);

  useEffect(() => {
    getBook(bookNr).then(setMeta).catch((e) => console.error('getBook', e));
  }, [bookNr]);

  const chapters = meta ? Array.from({ length: meta.chapter_count }, (_, i) => i + 1) : [];

  return (
    <>
      <Stack.Screen options={{ title: meta?.name ?? '' }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary" type="small" style={styles.hint}>
          Choisis un chapitre
        </ThemedText>
        <View style={styles.grid}>
          {chapters.map((c) => (
            <Pressable
              key={c}
              onPress={() =>
                router.push({
                  pathname: '/read/[book]/[chapter]',
                  params: { book: bookNr, chapter: c },
                })
              }
              style={({ pressed }) => [
                styles.cell,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}>
              <ThemedText style={styles.cellText}>{c}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  hint: {
    marginBottom: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 18,
  },
});

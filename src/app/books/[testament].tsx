import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getBooks, type BookRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';

export default function BooksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { testament } = useLocalSearchParams<{ testament: string }>();
  const isNT = testament === 'NT';
  const [books, setBooks] = useState<BookRow[]>([]);

  useEffect(() => {
    getBooks().then(setBooks).catch((e) => console.error('getBooks', e));
  }, []);

  const filtered = useMemo(
    () => books.filter((b) => b.testament === (isNT ? 'NT' : 'AT')),
    [books, isNT],
  );

  return (
    <>
      <Stack.Screen options={{ title: isNT ? 'Nouveau Testament' : 'Ancien Testament' }} />
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item) => String(item.nr)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/read/[book]', params: { book: item.nr } })}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}>
            <ThemedText style={styles.bookName}>{item.name}</ThemedText>
            <View style={styles.right}>
              <ThemedText themeColor="textSecondary" type="small">
                {item.chapter_count} ch.
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </View>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookName: { fontSize: 17 },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});

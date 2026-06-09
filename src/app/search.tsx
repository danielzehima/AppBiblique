import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  resolveReference,
  searchVersesByWord,
  type Reference,
  type SearchResult,
} from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [ref, setRef] = useState<Reference | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Recherche debouncée
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRef(null);
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [r, list] = await Promise.all([resolveReference(q), searchVersesByWord(q)]);
        setRef(r);
        setResults(list);
      } catch (e) {
        console.error('recherche', e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const goToVerse = (book: number, chapter: number, verse?: number) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/read/[book]/[chapter]',
      params: { book, chapter, ...(verse ? { v: verse } : {}) },
    });
  };

  const header = useMemo(
    () => (
      <View style={styles.headerArea}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Mot-clé ou référence (Jean 3:16)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {ref && (
          <Pressable
            onPress={() => goToVerse(ref.book, ref.chapter, ref.verse)}
            style={({ pressed }) => [
              styles.refCard,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Ionicons name="arrow-forward-circle" size={22} color="#FFFFFF" />
            <ThemedText style={styles.refText}>
              Aller à {ref.name} {ref.chapter}
              {ref.verse ? `:${ref.verse}` : ''}
            </ThemedText>
          </Pressable>
        )}

        {query.trim().length >= 2 && (
          <View style={styles.countRow}>
            {loading ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <ThemedText themeColor="textSecondary" type="small">
                {results.length === 0
                  ? 'Aucun résultat'
                  : `${results.length} verset${results.length > 1 ? 's' : ''}${
                      results.length >= 200 ? '+' : ''
                    }`}
              </ThemedText>
            )}
          </View>
        )}
      </View>
    ),
    [query, ref, results, loading, theme],
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Recherche' }} />
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingBottom: insets.bottom + Spacing.six,
        }}
        keyboardShouldPersistTaps="handled"
        data={results}
        keyExtractor={(item) => `${item.book}-${item.chapter}-${item.verse}`}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => goToVerse(item.book, item.chapter, item.verse)}
            style={({ pressed }) => [
              styles.result,
              { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}>
            <ThemedText type="smallBold" themeColor="tint">
              {item.bookName} {item.chapter}:{item.verse}
            </ThemedText>
            <ThemedText themeColor="textSecondary" numberOfLines={3} style={styles.resultText}>
              {item.text}
            </ThemedText>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  refCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  refText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countRow: {
    minHeight: 20,
    justifyContent: 'center',
  },
  result: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 21,
  },
});

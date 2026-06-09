import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { getBooks, type BookRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';

export default function ReadScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<BookRow[]>([]);

  useEffect(() => {
    getBooks().then(setBooks).catch((e) => console.error('getBooks', e));
  }, []);

  const sections = useMemo(() => {
    const at = books.filter((b) => b.testament === 'AT');
    const nt = books.filter((b) => b.testament === 'NT');
    return [
      { title: 'Ancien Testament', data: at },
      { title: 'Nouveau Testament', data: nt },
    ].filter((s) => s.data.length > 0);
  }, [books]);

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.three,
        paddingBottom: insets.bottom + Spacing.six,
        paddingHorizontal: Spacing.three,
      }}
      sections={sections}
      keyExtractor={(item) => String(item.nr)}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: theme.tint }]}>
              <Ionicons name="book" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={{ fontFamily: Fonts?.serif }}>
                Demeure
              </ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Genèse à l’Apocalypse
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [
              styles.searchBar,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">Rechercher un mot ou une référence</ThemedText>
          </Pressable>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <ThemedText themeColor="tint" type="smallBold" style={styles.sectionHeader}>
          {section.title.toUpperCase()}
        </ThemedText>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/read/[book]', params: { book: item.nr } })}
          style={({ pressed }) => [
            styles.row,
            { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
          ]}>
          <ThemedText style={styles.bookName}>{item.name}</ThemedText>
          <View style={styles.rowRight}>
            <ThemedText themeColor="textSecondary" type="small">
              {item.chapter_count} ch.
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
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
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    letterSpacing: 1,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookName: {
    fontSize: 17,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});

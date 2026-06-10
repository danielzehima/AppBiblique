import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { getBook, getChapterVerses } from '@/db/bible';
import { getLastRead } from '@/db/quiz';
import { getVerseOfDay } from '@/data/verse-of-day';
import { useTheme } from '@/hooks/use-theme';

type Tile = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [votd, setVotd] = useState<{ ref: string; text: string } | null>(null);

  useEffect(() => {
    const v = getVerseOfDay();
    Promise.all([getBook(v.book), getChapterVerses(v.book, v.chapter)])
      .then(([book, verses]) => {
        const found = verses.find((x) => x.verse === v.verse) ?? verses[0];
        if (found) {
          setVotd({ ref: `${book?.name ?? ''} ${v.chapter}:${found.verse}`, text: found.text });
        }
      })
      .catch((e) => console.error('votd', e));
  }, []);

  const openVotd = () => {
    const v = getVerseOfDay();
    router.push({
      pathname: '/read/[book]/[chapter]',
      params: { book: v.book, chapter: v.chapter, v: v.verse },
    });
  };

  const continueReading = async () => {
    const last = await getLastRead().catch(() => null);
    const target = last ?? { book: 1, chapter: 1 };
    router.push({
      pathname: '/read/[book]/[chapter]',
      params: { book: target.book, chapter: target.chapter },
    });
  };

  const tiles: Tile[] = [
    {
      icon: 'albums-outline',
      label: 'Ancien Testament',
      onPress: () => router.push({ pathname: '/books/[testament]', params: { testament: 'AT' } }),
    },
    {
      icon: 'book-outline',
      label: 'Nouveau Testament',
      onPress: () => router.push({ pathname: '/books/[testament]', params: { testament: 'NT' } }),
    },
    { icon: 'play-circle-outline', label: 'Continuer la lecture', onPress: continueReading },
    { icon: 'search-outline', label: 'Recherche', onPress: () => router.push('/search') },
    { icon: 'calendar-outline', label: 'Plans de lecture', onPress: () => router.push('/plans') },
    {
      icon: 'bookmarks-outline',
      label: 'Notes & favoris',
      onPress: () => router.push('/annotations'),
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{
        paddingHorizontal: Spacing.three,
        paddingTop: insets.top + Spacing.three,
        paddingBottom: insets.bottom + Spacing.six,
      }}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.tint }]}>
          <Ionicons name="book" size={20} color="#FFFFFF" />
        </View>
        <View>
          <ThemedText type="subtitle" style={{ fontFamily: Fonts?.serif }}>
            Demeure
          </ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Genèse à l’Apocalypse
          </ThemedText>
        </View>
      </View>

      {/* Verset du jour */}
      <Pressable
        onPress={openVotd}
        style={({ pressed }) => [
          styles.votd,
          { backgroundColor: theme.backgroundElement, borderColor: theme.tint, opacity: pressed ? 0.85 : 1 },
        ]}>
        <View style={styles.votdHead}>
          <Ionicons name="sunny-outline" size={16} color={theme.tint} />
          <ThemedText type="smallBold" themeColor="tint" style={{ letterSpacing: 1 }}>
            VERSET DU JOUR
          </ThemedText>
        </View>
        <ThemedText style={[styles.votdText, { fontFamily: Fonts?.serif }]}>
          {votd ? `« ${votd.text.trim()} »` : '…'}
        </ThemedText>
        {votd && (
          <ThemedText themeColor="textSecondary" type="small" style={styles.votdRef}>
            {votd.ref}
          </ThemedText>
        )}
      </Pressable>

      {/* Tuiles */}
      <View style={styles.grid}>
        {tiles.map((t) => (
          <Pressable
            key={t.label}
            onPress={t.onPress}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <View style={[styles.tileIcon, { backgroundColor: theme.tint }]}>
              <Ionicons name={t.icon} size={26} color="#FFFFFF" />
            </View>
            <ThemedText type="smallBold" style={styles.tileLabel}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  logo: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  votd: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  votdHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  votdText: { fontSize: 18, lineHeight: 28, fontStyle: 'italic' },
  votdRef: { textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  tileIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { textAlign: 'center' },
});

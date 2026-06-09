import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getBook, type BookRow } from '@/db/bible';
import { getBestScore, getReadCount, type BestScore } from '@/db/quiz';
import { getQuiz, hasQuiz } from '@/data/quiz';
import { useTheme } from '@/hooks/use-theme';

export default function ChaptersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookNr = Number(book);
  const [meta, setMeta] = useState<BookRow | null>(null);
  const [readCount, setReadCount] = useState(0);
  const [best, setBest] = useState<BestScore | null>(null);

  useEffect(() => {
    getBook(bookNr).then(setMeta).catch((e) => console.error('getBook', e));
  }, [bookNr]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getReadCount(bookNr), getBestScore(bookNr)])
        .then(([rc, bs]) => {
          if (!active) return;
          setReadCount(rc);
          setBest(bs);
        })
        .catch((e) => console.error('quiz state', e));
      return () => {
        active = false;
      };
    }, [bookNr]),
  );

  const chapters = meta ? Array.from({ length: meta.chapter_count }, (_, i) => i + 1) : [];
  const quizQuestions = getQuiz(bookNr);
  const quizExists = hasQuiz(bookNr);
  const unlocked = meta ? readCount >= meta.chapter_count : false;

  return (
    <>
      <Stack.Screen options={{ title: meta?.name ?? '' }} />
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        {/* Carte Quiz */}
        {quizExists && unlocked ? (
          <Pressable
            onPress={() => router.push({ pathname: '/read/[book]/quiz', params: { book: bookNr } })}
            style={({ pressed }) => [
              styles.quizCard,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Ionicons name="ribbon" size={24} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.quizTitle}>Quiz du livre</ThemedText>
              <ThemedText style={styles.quizSub}>
                {quizQuestions?.length} questions
                {best ? ` · meilleur score ${best.score}/${best.total}` : ''}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </Pressable>
        ) : quizExists ? (
          <View style={[styles.quizCardLocked, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Ionicons name="lock-closed" size={22} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Quiz verrouillé</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Lis tous les chapitres pour le débloquer ({readCount}/{meta?.chapter_count ?? '…'})
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={[styles.quizCardLocked, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Ionicons name="hourglass-outline" size={22} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary" type="small" style={{ flex: 1 }}>
              Quiz à venir pour ce livre
            </ThemedText>
          </View>
        )}

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
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginBottom: Spacing.four,
  },
  quizTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  quizSub: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 13,
  },
  quizCardLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.four,
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

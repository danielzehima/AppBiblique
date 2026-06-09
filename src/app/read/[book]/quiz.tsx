import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getQuiz, type QuizQuestion } from '@/data/quiz';
import { getBook } from '@/db/bible';
import { saveQuizAttempt } from '@/db/quiz';
import { useTheme } from '@/hooks/use-theme';

const CORRECT = '#3F8F5B';
const WRONG = '#C0492F';

export default function QuizScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookNr = Number(book);

  const [questions] = useState<QuizQuestion[]>(() => getQuiz(bookNr) ?? []);
  const [bookName, setBookName] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    getBook(bookNr).then((b) => setBookName(b?.name ?? '')).catch(() => {});
  }, [bookNr]);

  const total = questions.length;
  const current = questions[index];
  const isLast = index === total - 1;

  const validate = () => {
    if (selected === null) return;
    if (selected === current.answer) setScore((s) => s + 1);
    setRevealed(true);
  };

  const next = () => {
    if (isLast) {
      const finalScore = score; // déjà incrémenté à la validation
      saveQuizAttempt(bookNr, finalScore, total).catch((e) => console.error('saveQuizAttempt', e));
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
  };

  if (total === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Quiz' }} />
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <ThemedText themeColor="textSecondary">Aucun quiz disponible pour ce livre.</ThemedText>
        </View>
      </>
    );
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const message =
      pct >= 80 ? 'Excellent !' : pct >= 50 ? 'Bien joué, continue !' : 'Relis le livre et réessaie 🙂';
    return (
      <>
        <Stack.Screen options={{ title: `Quiz · ${bookName}` }} />
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <View style={[styles.scoreCircle, { borderColor: theme.tint }]}>
            <ThemedText type="title" style={{ color: theme.tint }}>
              {score}/{total}
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.resultTitle}>
            {message}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{pct}% de bonnes réponses</ThemedText>

          <Pressable onPress={restart} style={[styles.primaryBtn, { backgroundColor: theme.tint }]}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <ThemedText style={styles.primaryText}>Recommencer</ThemedText>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
            <ThemedText themeColor="tint">Retour</ThemedText>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Quiz · ${bookName}` }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ padding: Spacing.four, paddingBottom: insets.bottom + Spacing.six }}>
        <ThemedText themeColor="textSecondary" type="small">
          Question {index + 1} / {total}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.question}>
          {current.q}
        </ThemedText>

        <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
          {current.options.map((opt, i) => {
            const isSelected = selected === i;
            const isAnswer = i === current.answer;
            let borderColor: string = theme.border;
            let bg: string = theme.backgroundElement;
            if (revealed) {
              if (isAnswer) {
                borderColor = CORRECT;
                bg = CORRECT + '22';
              } else if (isSelected) {
                borderColor = WRONG;
                bg = WRONG + '22';
              }
            } else if (isSelected) {
              borderColor = theme.tint;
            }
            return (
              <Pressable
                key={i}
                disabled={revealed}
                onPress={() => setSelected(i)}
                style={[styles.option, { backgroundColor: bg, borderColor }]}>
                <ThemedText style={{ flex: 1 }}>{opt}</ThemedText>
                {revealed && isAnswer && <Ionicons name="checkmark-circle" size={20} color={CORRECT} />}
                {revealed && isSelected && !isAnswer && (
                  <Ionicons name="close-circle" size={20} color={WRONG} />
                )}
              </Pressable>
            );
          })}
        </View>

        {revealed && current.ref && (
          <ThemedText themeColor="textSecondary" type="small" style={styles.ref}>
            Référence : {bookName} {current.ref}
          </ThemedText>
        )}

        {!revealed ? (
          <Pressable
            onPress={validate}
            disabled={selected === null}
            style={[
              styles.primaryBtn,
              { backgroundColor: selected === null ? theme.border : theme.tint },
            ]}>
            <ThemedText style={styles.primaryText}>Valider</ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={next} style={[styles.primaryBtn, { backgroundColor: theme.tint }]}>
            <ThemedText style={styles.primaryText}>{isLast ? 'Voir le résultat' : 'Suivant'}</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.three,
  },
  question: {
    marginTop: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  ref: {
    marginTop: Spacing.three,
    fontStyle: 'italic',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.four,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: Spacing.two,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    textAlign: 'center',
  },
});

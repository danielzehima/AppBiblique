import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadingControls } from '@/components/reading-controls';
import { ThemedText } from '@/components/themed-text';
import { VerseActionsSheet, type VerseActionsState } from '@/components/verse-actions-sheet';
import { highlightColor } from '@/constants/highlights';
import { Fonts, Spacing } from '@/constants/theme';
import { getBook, getChapterVerses, type BookRow, type VerseRow } from '@/db/bible';
import {
  getChapterAnnotations,
  saveNote,
  setHighlight,
  toggleBookmark,
  type ChapterAnnotations,
} from '@/db/study';
import { markChapterRead } from '@/db/quiz';
import { useResolvedScheme } from '@/hooks/use-resolved-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useFontScale, useReadingSettings } from '@/store/reading-settings';

const EMPTY_ANNOTATIONS: ChapterAnnotations = { highlights: {}, notes: {}, bookmarks: new Set() };

export default function ReaderScreen() {
  const theme = useTheme();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { book, chapter, v } = useLocalSearchParams<{
    book: string;
    chapter: string;
    v?: string;
  }>();
  const bookNr = Number(book);
  const chapterNr = Number(chapter);
  const targetVerse = v ? Number(v) : undefined;

  const [meta, setMeta] = useState<BookRow | null>(null);
  const [verses, setVerses] = useState<VerseRow[]>([]);
  const [annotations, setAnnotations] = useState<ChapterAnnotations>(EMPTY_ANNOTATIONS);
  const [sheet, setSheet] = useState<VerseActionsState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const targetYRef = useRef<number | null>(null);

  const scrollToTarget = () => {
    if (targetYRef.current == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, targetYRef.current - 12), animated: true });
  };

  // Recale sur le verset cible une fois les versets affichés (navigation depuis
  // la recherche ou un passage de groupe).
  useEffect(() => {
    targetYRef.current = null;
    if (targetVerse == null || verses.length === 0) return;
    const t = setTimeout(scrollToTarget, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses, targetVerse]);

  const fontScale = useFontScale();
  const fontFamily = useReadingSettings((s) => s.fontFamily);
  const fontFamilyValue = fontFamily === 'serif' ? Fonts?.serif : Fonts?.sans;

  useEffect(() => {
    getBook(bookNr).then(setMeta).catch((e) => console.error('getBook', e));
  }, [bookNr]);

  useEffect(() => {
    getChapterVerses(bookNr, chapterNr)
      .then(setVerses)
      .catch((e) => console.error('getChapterVerses', e));
    markChapterRead(bookNr, chapterNr).catch((e) => console.error('markChapterRead', e));
  }, [bookNr, chapterNr]);

  const reloadAnnotations = useCallback(() => {
    getChapterAnnotations(bookNr, chapterNr)
      .then(setAnnotations)
      .catch((e) => console.error('getChapterAnnotations', e));
  }, [bookNr, chapterNr]);

  useEffect(() => {
    reloadAnnotations();
  }, [reloadAnnotations]);

  const openSheet = (verse: number) =>
    setSheet({
      verse,
      reference: `${meta?.name ?? ''} ${chapterNr}:${verse}`,
      color: annotations.highlights[verse],
      note: annotations.notes[verse] ?? '',
      bookmarked: annotations.bookmarks.has(verse),
    });

  const handleSetHighlight = async (color: string | null) => {
    if (!sheet) return;
    await setHighlight(bookNr, chapterNr, sheet.verse, color);
    reloadAnnotations();
    setSheet((s) => (s ? { ...s, color: color ?? undefined } : s));
  };

  const handleToggleBookmark = async () => {
    if (!sheet) return;
    const nv = await toggleBookmark(bookNr, chapterNr, sheet.verse);
    reloadAnnotations();
    setSheet((s) => (s ? { ...s, bookmarked: nv } : s));
  };

  const handleSaveNote = async (content: string) => {
    if (!sheet) return;
    await saveNote(bookNr, chapterNr, sheet.verse, content);
    reloadAnnotations();
    setSheet(null);
  };

  const hasPrev = chapterNr > 1;
  const hasNext = meta ? chapterNr < meta.chapter_count : false;
  const goTo = (c: number) =>
    router.replace({ pathname: '/read/[book]/[chapter]', params: { book: bookNr, chapter: c } });

  const verseFontSize = 18 * fontScale;
  const verseLineHeight = verseFontSize * 1.7;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: meta ? `${meta.name} ${chapterNr}` : '',
          headerRight: () => (
            <Pressable onPress={() => setSettingsOpen(true)} hitSlop={10}>
              <Ionicons name="text" size={22} color={theme.tint} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.three,
          paddingBottom: insets.bottom + Spacing.six,
        }}>
        <Text style={[styles.chapterTitle, { color: theme.tint, fontFamily: Fonts?.serif }]}>
          Chapitre {chapterNr}
        </Text>
        {verses.map((vrs) => {
          const userColor = highlightColor(annotations.highlights[vrs.verse], scheme);
          const isTarget = targetVerse === vrs.verse;
          const bg = userColor ?? (isTarget ? theme.backgroundSelected : undefined);
          const hasNote = annotations.notes[vrs.verse] != null;
          const bookmarked = annotations.bookmarks.has(vrs.verse);

          return (
            <Pressable
              key={vrs.verse}
              onPress={() => openSheet(vrs.verse)}
              onLayout={(e) => {
                if (isTarget) {
                  targetYRef.current = e.nativeEvent.layout.y;
                  scrollToTarget();
                }
              }}>
              <Text
                style={[
                  styles.verseLine,
                  { color: theme.text, fontSize: verseFontSize, lineHeight: verseLineHeight },
                  bg ? { backgroundColor: bg, borderRadius: Spacing.one } : null,
                ]}>
                <Text style={[styles.verseNum, { color: theme.tint }]}>{vrs.verse} </Text>
                <Text style={{ fontFamily: fontFamilyValue }}>{vrs.text}</Text>
                {hasNote ? (
                  <Text>
                    {'  '}
                    <Ionicons name="document-text" size={verseFontSize * 0.7} color={theme.tint} />
                  </Text>
                ) : null}
                {bookmarked ? (
                  <Text>
                    {' '}
                    <Ionicons name="bookmark" size={verseFontSize * 0.7} color={theme.tint} />
                  </Text>
                ) : null}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.nav,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom || Spacing.three,
          },
        ]}>
        <Pressable onPress={() => hasPrev && goTo(chapterNr - 1)} disabled={!hasPrev} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={hasPrev ? theme.tint : theme.border} />
          <ThemedText style={{ color: hasPrev ? theme.tint : theme.border }}>Précédent</ThemedText>
        </Pressable>
        <Pressable onPress={() => hasNext && goTo(chapterNr + 1)} disabled={!hasNext} style={styles.navBtn}>
          <ThemedText style={{ color: hasNext ? theme.tint : theme.border }}>Suivant</ThemedText>
          <Ionicons name="chevron-forward" size={22} color={hasNext ? theme.tint : theme.border} />
        </Pressable>
      </View>

      {/* Réglages de lecture */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSettingsOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}>
          <View style={styles.sheetHeader}>
            <ThemedText type="smallBold">Réglages de lecture</ThemedText>
            <Pressable onPress={() => setSettingsOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ReadingControls />
        </View>
      </Modal>

      {/* Actions sur un verset (surligner / noter / marquer) */}
      <VerseActionsSheet
        state={sheet}
        onClose={() => setSheet(null)}
        onSetHighlight={handleSetHighlight}
        onToggleBookmark={handleToggleBookmark}
        onSaveNote={handleSaveNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  verseLine: {
    marginBottom: Spacing.three,
  },
  verseNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

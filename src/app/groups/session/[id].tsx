import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDate } from '@/components/calendar-modal';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { getBooks, type BookRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';
import {
  getMessages,
  getSession,
  sendMessage,
  subscribeMessages,
  type GroupSession,
  type Message,
} from '@/lib/supabase/groups';
import { useAuth } from '@/store/auth';

export default function SessionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<GroupSession | null>(null);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getBooks().then(setBooks).catch(() => {});
  }, []);

  const loadMessages = useCallback(() => {
    if (!id) return;
    getMessages(id).then(setMessages).catch((e) => console.error('getMessages', e));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getSession(id).then(setSession).catch((e) => console.error('getSession', e));
    loadMessages();
    const unsub = subscribeMessages(id, loadMessages);
    return unsub;
  }, [id, loadMessages]);

  const bookName = (nr: number) => books.find((b) => b.nr === nr)?.name ?? `Livre ${nr}`;

  const send = async () => {
    if (!session || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(session.group_id, session.id, text);
      setText('');
      loadMessages();
    } catch (e) {
      console.error('sendMessage', e);
    } finally {
      setSending(false);
    }
  };

  const openReader = () => {
    if (!session) return;
    router.push({
      pathname: '/read/[book]/[chapter]',
      params: {
        book: session.book,
        chapter: session.chapter,
        ...(session.verse_start ? { v: session.verse_start } : {}),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.background }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen options={{ title: session?.title ?? 'Discussion' }} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {/* Passage */}
        {session && (
          <Pressable
            onPress={openReader}
            style={({ pressed }) => [
              styles.passage,
              { backgroundColor: theme.backgroundElement, borderColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" themeColor="tint">
                {bookName(session.book)} {session.chapter}
                {session.verse_start
                  ? `:${session.verse_start}${session.verse_end ? `-${session.verse_end}` : ''}`
                  : ''}
              </ThemedText>
              {session.scheduled_date ? (
                <ThemedText themeColor="textSecondary" type="small">
                  {formatDate(session.scheduled_date)}
                </ThemedText>
              ) : null}
              {session.note ? (
                <ThemedText style={{ marginTop: Spacing.one, fontFamily: Fonts?.serif }}>
                  {session.note}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.readBtn}>
              <Ionicons name="book" size={18} color="#FFFFFF" />
              <ThemedText style={styles.readText}>Lire</ThemedText>
            </View>
          </Pressable>
        )}

        <ThemedText type="smallBold" themeColor="tint" style={{ marginTop: Spacing.two }}>
          DISCUSSION
        </ThemedText>

        {messages.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="small">
            Aucun message. Lance la discussion sur ce passage !
          </ThemedText>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === user?.id;
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  mine
                    ? { backgroundColor: theme.tint, alignSelf: 'flex-end' }
                    : { backgroundColor: theme.backgroundElement, alignSelf: 'flex-start' },
                ]}>
                {!mine && (
                  <ThemedText type="smallBold" themeColor="tint" style={styles.author}>
                    {m.display_name ?? 'Membre'}
                  </ThemedText>
                )}
                <ThemedText style={{ color: mine ? '#FFFFFF' : theme.text }}>{m.content}</ThemedText>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Barre de saisie */}
      <View
        style={[
          styles.inputBar,
          { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom || Spacing.two },
        ]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ton message…"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
        />
        <Pressable
          onPress={send}
          disabled={sending || !text.trim()}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? theme.tint : theme.border }]}>
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  passage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  readText: { color: '#FFFFFF', fontWeight: '700' },
  bubble: {
    maxWidth: '85%',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    gap: 2,
  },
  author: { fontSize: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

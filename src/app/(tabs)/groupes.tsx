import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createGroup, getMyGroups, joinGroup, type Group } from '@/lib/supabase/groups';
import { useAuth } from '@/store/auth';

export default function GroupesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getMyGroups()
      .then(setGroups)
      .catch((e) => console.error('getMyGroups', e))
      .finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(reload);

  const openModal = (m: 'create' | 'join') => {
    setMode(m);
    setText1('');
    setText2('');
    setError(null);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'create') {
        if (!text1.trim()) throw new Error('Donne un nom au groupe.');
        const g = await createGroup(text1.trim(), text2.trim() || undefined);
        setMode(null);
        reload();
        router.push({ pathname: '/groups/[id]', params: { id: g.id } });
      } else if (mode === 'join') {
        if (!text1.trim()) throw new Error('Saisis un code.');
        const g = await joinGroup(text1.trim());
        setMode(null);
        reload();
        router.push({ pathname: '/groups/[id]', params: { id: g.id } });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="people-outline" size={48} color={theme.tint} />
        <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
          Groupes d’étude
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Connecte-toi pour créer ou rejoindre un groupe et étudier ensemble.
        </ThemedText>
        <Pressable onPress={() => router.push('/auth')} style={[styles.primary, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.primaryText}>Se connecter</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actions}>
          <Pressable onPress={() => openModal('create')} style={[styles.actionBtn, { backgroundColor: theme.tint }]}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>Créer</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => openModal('join')}
            style={[styles.actionBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Ionicons name="enter-outline" size={18} color={theme.tint} />
            <ThemedText themeColor="tint" style={{ fontWeight: '700' }}>Rejoindre</ThemedText>
          </Pressable>
        </View>

        {loading && groups.length === 0 ? (
          <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
        ) : groups.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Tu n’es membre d’aucun groupe. Crée-en un ou rejoins avec un code d’invitation.
          </ThemedText>
        ) : (
          groups.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push({ pathname: '/groups/[id]', params: { id: g.id } })}
              style={({ pressed }) => [
                styles.groupRow,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <View style={[styles.groupIcon, { backgroundColor: theme.tint }]}>
                <Ionicons name="people" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{g.name}</ThemedText>
                {g.description ? (
                  <ThemedText themeColor="textSecondary" type="small" numberOfLines={1}>
                    {g.description}
                  </ThemedText>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={() => setMode(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMode(null)} />
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={[styles.modal, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="smallBold">
              {mode === 'create' ? 'Créer un groupe' : 'Rejoindre un groupe'}
            </ThemedText>
            <TextInput
              value={text1}
              onChangeText={setText1}
              placeholder={mode === 'create' ? 'Nom du groupe' : "Code d'invitation"}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize={mode === 'join' ? 'characters' : 'sentences'}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
            />
            {mode === 'create' && (
              <TextInput
                value={text2}
                onChangeText={setText2}
                placeholder="Description (optionnel)"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
              />
            )}
            {error && (
              <ThemedText type="small" style={{ color: '#C0492F' }}>
                {error}
              </ThemedText>
            )}
            <Pressable onPress={submit} disabled={busy} style={[styles.primary, { backgroundColor: theme.tint, opacity: busy ? 0.7 : 1 }]}>
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.primaryText}>{mode === 'create' ? 'Créer' : 'Rejoindre'}</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.three },
  content: { padding: Spacing.three, gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  actionText: { color: '#FFFFFF', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: Spacing.five, paddingHorizontal: Spacing.four },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  groupIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.two,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalWrap: { flex: 1, justifyContent: 'center', padding: Spacing.four },
  modal: {
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});

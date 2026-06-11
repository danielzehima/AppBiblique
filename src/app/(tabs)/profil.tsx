import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NotificationControls } from '@/components/notification-controls';
import { ReadingControls } from '@/components/reading-controls';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store/auth';

export default function ProfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split('@')[0];

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
        MON ÉTUDE
      </ThemedText>
      <Pressable
        onPress={() => router.push('/annotations')}
        style={({ pressed }) => [
          styles.card,
          styles.linkRow,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="bookmarks-outline" size={22} color={theme.tint} />
        <ThemedText style={{ flex: 1 }}>Mes notes & marque-pages</ThemedText>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </Pressable>

      <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
        PRÉFÉRENCES DE LECTURE
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ReadingControls />
      </ThemedView>

      <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
        NOTIFICATIONS
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <NotificationControls />
      </ThemedView>

      <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
        COMPTE
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        {user ? (
          <View style={{ gap: Spacing.three }}>
            <View style={styles.accountRow}>
              <Ionicons name="person-circle" size={32} color={theme.tint} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{displayName}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {user.email}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={signOut}
              style={({ pressed }) => [
                styles.signOut,
                { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Ionicons name="log-out-outline" size={18} color="#C0492F" />
              <ThemedText style={{ color: '#C0492F' }}>Se déconnecter</ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/auth')}
            style={({ pressed }) => [styles.accountRow, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="person-circle-outline" size={28} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <ThemedText>Se connecter</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Pour rejoindre un groupe et suivre un plan d’étude
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  section: {
    letterSpacing: 1,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ReadingControls } from '@/components/reading-controls';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfilScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
        PRÉFÉRENCES DE LECTURE
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ReadingControls />
      </ThemedView>

      <ThemedText type="smallBold" themeColor="tint" style={styles.section}>
        COMPTE
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.accountRow}>
          <Ionicons name="person-circle-outline" size={28} color={theme.textSecondary} />
          <View style={{ flex: 1 }}>
            <ThemedText>Non connecté</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Connexion (Apple / Google) — à venir
            </ThemedText>
          </View>
        </View>
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});

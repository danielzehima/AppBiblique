import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ReadScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: theme.tint }]}>
          <Ionicons name="book" size={36} color="#FFFFFF" />
        </View>
        <ThemedText type="title" style={[styles.appName, { fontFamily: Fonts?.serif }]}>
          Demeure
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.tagline}>
          Étude biblique de la Genèse à l’Apocalypse
        </ThemedText>
      </View>

      <Pressable
        style={[styles.cta, { backgroundColor: theme.tint }]}
        accessibilityRole="button">
        <Ionicons name="play" size={18} color="#FFFFFF" />
        <ThemedText style={styles.ctaText}>Commencer la lecture</ThemedText>
      </Pressable>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Bientôt disponible ici</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          • Sélection du livre et du chapitre{'\n'}• Versions au choix (Segond 1910…){'\n'}•
          Réglages de lecture (thème, taille, police){'\n'}• Notes et surlignages
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  appName: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
});

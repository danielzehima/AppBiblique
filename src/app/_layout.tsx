import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { initBible } from '@/db/bible';
import { useResolvedScheme } from '@/hooks/use-resolved-scheme';

export default function RootLayout() {
  const scheme = useResolvedScheme();
  const colors = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      primary: colors.tint,
      border: colors.border,
    },
  };

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    initBible((p) => active && setProgress(p))
      .then(() => active && setReady(true))
      .catch((e) => {
        console.error('initBible a échoué', e);
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ThemeProvider value={navTheme}>
      {ready ? (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="read/[book]/index" />
          <Stack.Screen name="read/[book]/[chapter]" />
        </Stack>
      ) : (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.tint} size="large" />
          <ThemedText themeColor="textSecondary">
            Préparation de la Bible… {Math.round(progress * 100)}%
          </ThemedText>
        </View>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});

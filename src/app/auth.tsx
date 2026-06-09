import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || password.length < 6) {
      setError('Email requis et mot de passe d’au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.back();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (data.session) {
          router.back(); // connecté directement (confirmation email désactivée)
        } else {
          setInfo('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.');
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
  ];

  return (
    <>
      <Stack.Screen options={{ title: mode === 'signin' ? 'Connexion' : 'Inscription' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={[styles.logo, { backgroundColor: theme.tint }]}>
              <Ionicons name="book" size={28} color="#FFFFFF" />
            </View>
            <ThemedText type="subtitle" style={{ fontFamily: Fonts?.serif }}>
              Demeure
            </ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {mode === 'signin' ? 'Connecte-toi pour rejoindre un groupe' : 'Crée ton compte'}
            </ThemedText>
          </View>

          {mode === 'signup' && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ton nom (affiché aux membres)"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              autoCapitalize="words"
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe (6 caractères min.)"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
            secureTextEntry
          />

          {error && (
            <ThemedText type="small" style={{ color: '#C0492F' }}>
              {error}
            </ThemedText>
          )}
          {info && (
            <ThemedText type="small" style={{ color: '#3F8F5B' }}>
              {info}
            </ThemedText>
          )}

          <Pressable
            onPress={submit}
            disabled={loading}
            style={[styles.submit, { backgroundColor: theme.tint, opacity: loading ? 0.7 : 1 }]}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitText}>
                {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setInfo(null);
            }}
            style={styles.switch}>
            <ThemedText themeColor="textSecondary" type="small">
              {mode === 'signin' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
              <ThemedText type="smallBold" themeColor="tint">
                {mode === 'signin' ? "S'inscrire" : 'Se connecter'}
              </ThemedText>
            </ThemedText>
          </Pressable>

          <ThemedText themeColor="textSecondary" type="small" style={styles.note}>
            La connexion avec Apple et Google arrivera prochainement.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    justifyContent: 'center',
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  submit: {
    height: 50,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  note: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});

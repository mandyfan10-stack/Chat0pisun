import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import type { LoginScreenProps } from '../../../navigation/types';
import { colors, spacing, borderRadius } from '../../../shared/theme';

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch {
      // Store state renders the backend error.
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <View style={styles.brandMark}>
        <Text style={styles.brandGlyph}>◐</Text>
      </View>

      <Typography variant="h1" style={styles.brand}>
        CHAT0PISUN
      </Typography>
      <Typography style={styles.subtitle}>
        писать — это существовать вместе
      </Typography>

      <View style={styles.panel}>
        <Typography variant="h2" style={styles.title}>
          Вход
        </Typography>

        <View style={[styles.fieldWrap, emailFocused && styles.fieldFocused]}>
          <Text style={styles.fieldLabel}>ЭЛЕКТРОННАЯ ПОЧТА</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="you@chat0pisun.app"
            placeholderTextColor={colors.ink3}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            accessibilityLabel="Email"
          />
        </View>

        <View style={[styles.fieldWrap, passFocused && styles.fieldFocused]}>
          <Text style={styles.fieldLabel}>ПАРОЛЬ</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="••••••••••"
            placeholderTextColor={colors.ink3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
            accessibilityLabel="Password"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Typography color="error">{error}</Typography>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.ctaButton, isSubmitting && styles.ctaDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Login"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.canvas} />
          ) : (
            <Text style={styles.ctaText}>войти в эфир →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          accessibilityLabel="Register instead"
        >
          <Text style={styles.switchText}>
            Нет аккаунта? <Text style={styles.switchAccent}>Создать</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.canvas,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  brandGlyph: {
    fontSize: 28,
    color: colors.canvas,
    lineHeight: 32,
  },
  brand: {
    textAlign: 'center',
    letterSpacing: 3,
    color: colors.ink,
    fontFamily: 'monospace',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.ink3,
    fontStyle: 'italic',
    fontSize: 15,
  },
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.lg,
    color: colors.ink,
    fontFamily: 'serif',
  },
  fieldWrap: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.panel,
  },
  fieldFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.panel2,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: colors.ink3,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  fieldInput: {
    color: colors.ink,
    fontSize: 18,
    fontFamily: 'serif',
    padding: 0,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,122,89,0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,122,89,0.08)',
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: colors.canvas,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  switchLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  switchText: {
    color: colors.ink3,
    fontSize: 13,
  },
  switchAccent: {
    color: colors.accent,
    fontWeight: '600',
  },
});

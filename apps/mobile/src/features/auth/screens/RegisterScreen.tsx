import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Text } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import type { RegisterScreenProps } from '../../../navigation/types';
import { colors, spacing, borderRadius } from '../../../shared/theme';

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const handleRegister = async () => {
    try {
      await register({ email, password, username, displayName });
    } catch {
      // Store state renders the backend error.
    }
  };

  const fieldStyle = (name: string) => [
    styles.fieldWrap,
    focusedField === name && styles.fieldFocused,
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo mark */}
      <View style={styles.brandMark}>
        <Text style={styles.brandGlyph}>◐</Text>
      </View>

      <Typography variant="h1" style={styles.brand}>
        CHAT0PISUN
      </Typography>
      <Typography style={styles.subtitle}>
        создайте аккаунт и начните общение
      </Typography>

      <View style={styles.panel}>
        <Typography variant="h2" style={styles.title}>
          Регистрация
        </Typography>

        <View style={fieldStyle('name')}>
          <Text style={styles.fieldLabel}>ИМЯ</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Айдар Сатпаев"
            placeholderTextColor={colors.ink3}
            value={displayName}
            onChangeText={setDisplayName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Display name"
          />
        </View>

        <View style={fieldStyle('username')}>
          <Text style={styles.fieldLabel}>ХЕНДЛ</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMono]}
            placeholder="aidar"
            placeholderTextColor={colors.ink3}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Username"
          />
        </View>

        <View style={fieldStyle('email')}>
          <Text style={styles.fieldLabel}>ЭЛЕКТРОННАЯ ПОЧТА</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="you@chat0pisun.app"
            placeholderTextColor={colors.ink3}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Email"
          />
        </View>

        <View style={fieldStyle('password')}>
          <Text style={styles.fieldLabel}>ПАРОЛЬ</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="••••••••••"
            placeholderTextColor={colors.ink3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
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
          onPress={handleRegister}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Register"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.canvas} />
          ) : (
            <Text style={styles.ctaText}>создать аккаунт →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <Text style={styles.switchText}>
            Уже есть аккаунт? <Text style={styles.switchAccent}>Войти</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
    fontSize: 14,
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
  fieldInputMono: {
    fontFamily: 'monospace',
    fontSize: 15,
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

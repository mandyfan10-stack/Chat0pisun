import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import type { LoginScreenProps } from '../../../navigation/types';
import { theme } from '../../../shared/theme';

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <View style={styles.brandMark}>
        <MaterialCommunityIcons name="message-text" size={30} color={theme.colors.white} />
      </View>
      <Typography variant="h1" style={styles.brand}>
        NEXTGRAM
      </Typography>
      <Typography color="textSecondary" align="center" style={styles.subtitle}>
        Secure local messenger with persistent chats.
      </Typography>

      <View style={styles.panel}>
        <Typography variant="h2" style={styles.title}>
          Sign in
        </Typography>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Typography color="error">{error}</Typography>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Login"
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Typography color="white" style={styles.buttonText}>
              Sign in
            </Typography>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          accessibilityLabel="Register instead"
        >
          <Typography color="primaryLight" style={styles.secondaryText}>
            Create account
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  brand: {
    textAlign: 'center',
    letterSpacing: 2,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.input,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  errorBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryText: {
    fontWeight: '700',
  },
});

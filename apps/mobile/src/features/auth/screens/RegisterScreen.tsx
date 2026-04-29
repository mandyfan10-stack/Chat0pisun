import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import type { RegisterScreenProps } from '../../../navigation/types';
import { theme } from '../../../shared/theme';

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
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

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.brandMark}>
        <MaterialCommunityIcons name="send" size={30} color={theme.colors.white} />
      </View>
      <Typography variant="h1" style={styles.brand}>
        NEXTGRAM
      </Typography>
      <Typography color="textSecondary" align="center" style={styles.subtitle}>
        Create a profile to start secure direct chats.
      </Typography>

      <View style={styles.panel}>
        <Typography variant="h2" style={styles.title}>
          Register
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
          placeholder="Username"
          placeholderTextColor={theme.colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          accessibilityLabel="Username"
        />
        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor={theme.colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          accessibilityLabel="Display name"
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
          onPress={handleRegister}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Register"
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Typography color="white" style={styles.buttonText}>
              Create account
            </Typography>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <Typography color="primaryLight" style={styles.secondaryText}>
            Back to sign in
          </Typography>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
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

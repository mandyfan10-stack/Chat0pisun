import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
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
      <Typography variant="h1">Login</Typography>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
      />
      {error ? (
        <Typography color="error" style={styles.error}>
          {error}
        </Typography>
      ) : null}
      {isSubmitting ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <Button title="Login" onPress={handleLogin} accessibilityLabel="Login" />
      )}
      <Button
        title="Register instead"
        onPress={() => navigation.navigate('Register')}
        accessibilityLabel="Register instead"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, borderRadius: 8 },
  error: { marginBottom: 10 },
});

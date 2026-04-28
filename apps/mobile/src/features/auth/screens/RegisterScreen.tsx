import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
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
    <View style={styles.container}>
      <Typography variant="h1">Register</Typography>
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
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        accessibilityLabel="Username"
      />
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        accessibilityLabel="Display name"
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
        <Button title="Register" onPress={handleRegister} accessibilityLabel="Register" />
      )}
      <Button
        title="Back to Login"
        onPress={() => navigation.navigate('Login')}
        accessibilityLabel="Back to login"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, borderRadius: 8 },
  error: { marginBottom: 10 },
});

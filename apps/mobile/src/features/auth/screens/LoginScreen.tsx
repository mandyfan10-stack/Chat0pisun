import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { API_URL } from '../../../config/env';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useAuthStore((state) => state.signIn);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        signIn(data.user, data.accessToken, data.refreshToken);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Login failed');
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
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Register instead" onPress={() => navigation.navigate('Register')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, borderRadius: 8 }
});

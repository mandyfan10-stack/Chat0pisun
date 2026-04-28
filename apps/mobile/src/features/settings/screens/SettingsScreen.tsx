import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';

export const SettingsScreen = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  return (
    <View style={styles.container}>
      <Typography variant="h2">{user?.displayName}</Typography>
      <Typography variant="body" color="textSecondary">{user?.email}</Typography>

      <View style={styles.section}>
        <Button title="Logout" color={theme.colors.error} onPress={() => void logout()} accessibilityLabel="Logout" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  section: { marginTop: theme.spacing.lg }
});

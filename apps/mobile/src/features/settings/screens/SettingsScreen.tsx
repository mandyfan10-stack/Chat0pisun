import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { Avatar } from '../../../shared/components/Avatar';
import { theme } from '../../../shared/theme';

const settingsItems = [
  { label: 'My profile', icon: 'account-outline' },
  { label: 'Notifications', icon: 'bell-outline' },
  { label: 'Privacy', icon: 'lock-outline' },
  { label: 'Data and storage', icon: 'database-outline' },
  { label: 'Appearance', icon: 'palette-outline' },
  { label: 'Help', icon: 'help-circle-outline' },
] as const;

export const SettingsScreen = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Avatar name={user?.displayName || user?.username} uri={user?.avatarUrl ?? undefined} size={64} />
        <View style={styles.profileText}>
          <Typography variant="h2" numberOfLines={1}>{user?.displayName || user?.username}</Typography>
          <Typography variant="body" color="textSecondary" numberOfLines={1}>{user?.email}</Typography>
        </View>
      </View>

      <View style={styles.section}>
        {settingsItems.map((item) => (
          <View
            key={item.label}
            style={styles.row}
          >
            <MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.textSecondary} />
            <Typography style={styles.rowText}>{item.label}</Typography>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.row, styles.logoutRow]}
        onPress={() => void logout()}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <MaterialCommunityIcons name="logout" size={22} color={theme.colors.error} />
        <Typography color="error" style={styles.rowText}>Logout</Typography>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  profileText: {
    flex: 1,
  },
  section: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontWeight: '600',
  },
  logoutRow: {
    marginTop: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
  },
});

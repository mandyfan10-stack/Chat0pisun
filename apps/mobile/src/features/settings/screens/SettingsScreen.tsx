import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { Avatar } from '../../../shared/components/Avatar';
import { theme } from '../../../shared/theme';

const settingsItems = [
  { label: 'Notifications', icon: 'bell-outline' },
  { label: 'Privacy', icon: 'lock-outline' },
  { label: 'Data and storage', icon: 'database-outline' },
  { label: 'Appearance', icon: 'palette-outline' },
  { label: 'Help', icon: 'help-circle-outline' },
] as const;

export const SettingsScreen = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const uploadAvatar = useAuthStore(state => state.uploadAvatar);
  const isSubmitting = useAuthStore(state => state.isSubmitting);
  const error = useAuthStore(state => state.error);

  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName ?? '');
  const [editBio, setEditBio] = useState(user?.bio ?? '');

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      try {
        await uploadAvatar(asset.uri, type, filename);
        Alert.alert('Success', 'Avatar updated successfully');
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to upload avatar');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ displayName: editDisplayName, bio: editBio });
      setIsEditing(false);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handlePickImage} disabled={isSubmitting}>
          <Avatar name={user?.displayName || user?.username} uri={user?.avatarUrl ?? undefined} size={80} />
          <View style={styles.avatarEditOverlay}>
            <MaterialCommunityIcons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <View style={styles.profileText}>
          {!isEditing ? (
            <>
              <Typography variant="h2" numberOfLines={1}>{user?.displayName || user?.username}</Typography>
              <Typography variant="body" color="textSecondary" numberOfLines={1}>{user?.email}</Typography>
              {user?.bio ? (
                <Typography variant="bodySmall" color="textSecondary" style={styles.bioText}>{user.bio}</Typography>
              ) : null}
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Typography variant="bodySmall" color="primary">Edit Profile</Typography>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                placeholder="Display Name"
                placeholderTextColor={theme.colors.textTertiary}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Bio"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Typography style={styles.actionButtonText}>Save</Typography>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  <Typography style={styles.actionButtonText}>Cancel</Typography>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {error && !isEditing ? (
        <Typography color="error" style={styles.errorText}>{error}</Typography>
      ) : null}

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
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  profileText: {
    flex: 1,
  },
  bioText: {
    marginTop: 4,
  },
  editButton: {
    marginTop: 8,
  },
  editForm: {
    gap: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    fontSize: 14,
  },
  bioInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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

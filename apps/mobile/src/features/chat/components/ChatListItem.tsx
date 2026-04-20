import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Avatar } from '../../../shared/components/Avatar';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';

interface ChatListItemProps {
  chat: any;
  onPress: (chatId: string) => void;
}

// ⚡ Bolt Optimization: Memoize ChatListItem to prevent unnecessary re-renders in FlatList
export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat, onPress }) => {
  const currentUser = useAuthStore(state => state.user);

  // ⚡ Bolt Optimization: Memoize otherParticipant logic to avoid finding the other user on every re-render
  const otherParticipant = React.useMemo(() => {
    return chat.participants.find((p: any) => p.userId !== currentUser?.id)?.user || chat.participants[0]?.user;
  }, [chat.participants, currentUser?.id]);

  // ⚡ Bolt Optimization: Memoize date formatting to avoid creating Date objects and formatting strings unnecessarily
  const formattedTime = React.useMemo(() => {
    if (!chat.updatedAt) return '';
    try {
        const date = new Date(chat.updatedAt);
        return format(date, 'HH:mm');
    } catch {
        return '';
    }
  }, [chat.updatedAt]);

  const handlePress = React.useCallback(() => {
    onPress(chat.id);
  }, [chat.id, onPress]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar name={otherParticipant?.displayName || 'User'} uri={otherParticipant?.avatarUrl} size={56} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Typography variant="h3" numberOfLines={1} style={styles.name}>
            {otherParticipant?.displayName}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {formattedTime}
          </Typography>
        </View>

        <View style={styles.messageRow}>
          <Typography
            variant="body"
            color="textSecondary"
            numberOfLines={2}
            style={styles.messageText}
          >
            {chat.messages?.[0]?.text || 'No messages yet'}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  name: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
});

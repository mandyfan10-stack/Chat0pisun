import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Avatar } from '../../../shared/components/Avatar';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';
import type { Chat } from '../types';

interface ChatListItemProps {
  chat: Chat;
  onPress: (chatId: string) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat, onPress }) => {
  const currentUser = useAuthStore(state => state.user);
  const otherParticipant =
    chat.participants.find((participant) => participant.userId !== currentUser?.id)?.user ||
    chat.participants[0]?.user;

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chat.id)}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${otherParticipant?.displayName ?? 'user'}`}
    >
      <View style={styles.avatarContainer}>
        <Avatar name={otherParticipant?.displayName || 'User'} uri={otherParticipant?.avatarUrl ?? undefined} size={56} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Typography variant="h3" numberOfLines={1} style={styles.name}>
            {otherParticipant?.displayName ?? 'Unknown user'}
          </Typography>
          <Typography variant="caption" color="textMuted">
            {formatTime(chat.updatedAt)}
          </Typography>
        </View>

        <View style={styles.messageRow}>
          <Typography
            variant="body"
            color="textSecondary"
            numberOfLines={2}
            style={styles.messageText}
          >
            {chat.lastMessage?.text || 'No messages yet'}
          </Typography>
          {chat.lastMessage ? (
            <View style={styles.unreadBadge}>
              <Typography variant="caption" color="white" style={styles.unreadText}>
                1
              </Typography>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.backgroundSecondary,
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
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontWeight: '700',
  },
});

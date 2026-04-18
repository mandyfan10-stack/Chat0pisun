import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Chat } from '../types';
import { ChatService } from '../services/api';
import { Avatar } from '../../../shared/components/Avatar';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';

interface ChatListItemProps {
  chat: Chat;
  onPress: (chatId: string) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress }) => {
  const currentUserId = ChatService.getCurrentUserId();
  const otherParticipant = chat.participants.find((p) => p.id !== currentUserId) || chat.participants[0];

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    // Simple format, in a real app might want "Yesterday", etc.
    return format(date, 'HH:mm');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chat.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar name={otherParticipant.name} uri={otherParticipant.avatarUrl} size={56} />
        {otherParticipant.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Typography variant="h3" numberOfLines={1} style={styles.name}>
            {otherParticipant.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
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

          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Typography variant="caption" color="white" style={styles.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Typography>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759', // iOS green
    borderWidth: 2,
    borderColor: theme.colors.background,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontWeight: 'bold',
  },
});

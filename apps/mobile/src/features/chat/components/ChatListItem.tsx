import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { format } from 'date-fns';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Avatar } from '../../../shared/components/Avatar';
import { Typography } from '../../../shared/components/Typography';
import { colors, spacing, borderRadius } from '../../../shared/theme';
import type { Chat } from '../types';

interface ChatListItemProps {
  chat: Chat;
  folder: 'personal' | 'work';
  isUnread: boolean;
  onPress: (chatId: string) => void;
  onToggleFolder: (chatId: string) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(
  ({ chat, folder, isUnread, onPress, onToggleFolder }) => {
    const currentUser = useAuthStore(state => state.user);
    const isGroup = chat.type === 'GROUP';

    const otherParticipant = !isGroup
      ? chat.participants.find((participant) => participant.userId !== currentUser?.id)?.user ||
        chat.participants[0]?.user
      : null;

    const displayName = isGroup ? chat.name : otherParticipant?.displayName || 'User';
    const lastSenderName =
      isGroup && chat.lastMessage
        ? chat.participants.find(p => p.userId === chat.lastMessage?.senderId)?.user.displayName ||
          'User'
        : null;

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
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${displayName}`}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            name={displayName || 'User'}
            uri={(isGroup ? chat.avatarUrl : otherParticipant?.avatarUrl) ?? undefined}
            size={52}
          />
          {/* Online dot placeholder */}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.time}>{formatTime(chat.updatedAt)}</Text>
          </View>

          <View style={styles.messageRow}>
            <Typography
              variant="body"
              color="textSecondary"
              numberOfLines={1}
              style={styles.messageText}
            >
              {lastSenderName ? (
                <Text style={styles.senderName}>{lastSenderName}: </Text>
              ) : null}
              {chat.lastMessage?.text || 'нет сообщений'}
            </Typography>
            {isUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>1</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 17,
    fontFamily: 'serif',
    color: colors.ink,
    fontWeight: '400',
  },
  time: {
    fontSize: 10,
    color: colors.ink3,
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 13,
    color: colors.ink2,
  },
  senderName: {
    color: colors.accent,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: colors.canvas,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

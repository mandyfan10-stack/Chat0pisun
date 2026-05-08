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
  folder: 'personal' | 'work';
  isUnread: boolean;
  onPress: (chatId: string) => void;
  onToggleFolder: (chatId: string) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat, folder, isUnread, onPress, onToggleFolder }) => {
  const currentUser = useAuthStore(state => state.user);
  const isGroup = chat.type === 'GROUP';

  const otherParticipant = !isGroup 
    ? (chat.participants.find((participant) => participant.userId !== currentUser?.id)?.user || chat.participants[0]?.user)
    : null;

  const displayName = isGroup ? chat.name : (otherParticipant?.displayName || 'User');
  const lastSenderName = isGroup && chat.lastMessage
    ? chat.participants.find(p => p.userId === chat.lastMessage?.senderId)?.user.displayName || 'User'
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
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${displayName}`}
    >
      <View style={styles.avatarContainer}>
        <Avatar 
          name={displayName || 'User'} 
          uri={(isGroup ? chat.avatarUrl : otherParticipant?.avatarUrl) ?? undefined} 
          size={56} 
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Typography variant="h3" numberOfLines={1} style={styles.name}>
            {displayName}
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
            {lastSenderName ? <Typography variant="body" color="primary">{lastSenderName}: </Typography> : null}
            {chat.lastMessage?.text || 'No messages yet'}
          </Typography>
          {isUnread ? (
            <View style={styles.unreadBadge}>
              <Typography variant="caption" color="white" style={styles.unreadText}>
                1
              </Typography>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.folderChip}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFolder(chat.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Move chat to ${folder === 'work' ? 'personal' : 'work'}`}
        >
          <Typography color="textSecondary" style={styles.folderText}>
            {isGroup ? 'Group' : (folder === 'work' ? 'Work' : 'Personal')}
          </Typography>
        </TouchableOpacity>
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
  folderChip: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  folderText: {
    fontSize: 11,
    fontWeight: '700',
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

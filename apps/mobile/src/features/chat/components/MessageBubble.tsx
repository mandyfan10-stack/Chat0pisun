import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
  const currentUser = useAuthStore(state => state.user);
  const isMine = message.senderId === currentUser?.id;

  const getStatusIcon = () => {
    if (!isMine) return null;

    if (message.readAt) {
      return <MaterialCommunityIcons name="check-all" size={14} color={theme.colors.primaryLight} />;
    }

    switch (message.status) {
      case 'sending':
        return <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textSecondary} />;
      case 'error':
        return <MaterialCommunityIcons name="alert-circle-outline" size={14} color={theme.colors.error} />;
      case 'sent':
      default:
        return <MaterialCommunityIcons name="check" size={14} color={theme.colors.textSecondary} />;
    }
  };

  const formattedTime = message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '';

  return (
    <View style={[styles.container, isMine ? styles.containerMine : styles.containerOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Typography style={styles.text}>{message.text}</Typography>
        <View style={styles.footer}>
          <Typography variant="caption" color="textSecondary" style={styles.time}>
            {formattedTime}
          </Typography>
          {getStatusIcon()}
        </View>
        <View style={[styles.tail, isMine ? styles.tailMine : styles.tailOther]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
  },
  containerMine: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    position: 'relative',
  },
  bubbleMine: {
    backgroundColor: theme.colors.messageSent,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: theme.colors.messageReceived,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    minWidth: 40,
  },
  time: {
    fontSize: 11,
    marginRight: 4,
  },
  tail: {
    position: 'absolute',
    bottom: 0,
    width: 18,
    height: 18,
    zIndex: -1,
  },
  tailMine: {
    right: -8,
    borderBottomLeftRadius: 16,
    backgroundColor: theme.colors.messageSent,
  },
  tailOther: {
    left: -8,
    borderBottomRightRadius: 16,
    backgroundColor: theme.colors.messageReceived,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
});

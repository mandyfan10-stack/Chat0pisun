import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Message } from '../types';
import { ChatService } from '../services/api';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
  const isMine = message.senderId === ChatService.getCurrentUserId();

  const getStatusIcon = () => {
    if (!isMine) return null;
    switch (message.status) {
      case 'sending':
        return <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textSecondary} />;
      case 'sent':
        return <MaterialCommunityIcons name="check" size={14} color={theme.colors.textSecondary} />;
      case 'read':
        return <MaterialCommunityIcons name="check-all" size={14} color={theme.colors.primary} />;
      case 'error':
        return <MaterialCommunityIcons name="alert-circle-outline" size={14} color={theme.colors.error} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isMine ? styles.containerMine : styles.containerOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Typography style={styles.text}>{message.text}</Typography>
        <View style={styles.footer}>
          <Typography variant="caption" color="textSecondary" style={styles.time}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Typography>
          {getStatusIcon()}
        </View>
        {/* Tail */}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    position: 'relative',
  },
  bubbleMine: {
    backgroundColor: theme.colors.messageSent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.messageReceived,
    borderBottomLeftRadius: 4,
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
    width: 20,
    height: 20,
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

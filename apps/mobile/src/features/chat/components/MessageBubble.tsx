import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { colors, spacing } from '../../../shared/theme';
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
      return <MaterialCommunityIcons name="check-all" size={14} color={isMine ? colors.canvas : colors.accent} />;
    }

    switch (message.status) {
      case 'sending':
        return <MaterialCommunityIcons name="clock-outline" size={14} color={isMine ? 'rgba(20,17,13,0.5)' : colors.ink3} />;
      case 'error':
        return <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.warm} />;
      case 'sent':
      default:
        return <MaterialCommunityIcons name="check" size={14} color={isMine ? 'rgba(20,17,13,0.5)' : colors.ink3} />;
    }
  };

  const formattedTime = message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '';

  return (
    <View style={[styles.container, isMine ? styles.containerMine : styles.containerOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Typography style={[styles.text, isMine ? styles.textMine : styles.textOther]}>
          {message.text}
        </Typography>
        <View style={styles.footer}>
          <Typography
            variant="caption"
            style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}
          >
            {formattedTime}
          </Typography>
          {getStatusIcon()}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  bubbleMine: {
    backgroundColor: colors.bubbleOut,
    borderRadius: 22,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleIn,
    borderRadius: 22,
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  textMine: {
    color: colors.bubbleOutInk,
  },
  textOther: {
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 4,
    opacity: 0.7,
  },
  time: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  timeMine: {
    color: colors.bubbleOutInk,
  },
  timeOther: {
    color: colors.ink3,
  },
});

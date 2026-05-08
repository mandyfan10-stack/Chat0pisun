import React, { useEffect, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';
import type { ChatRoomScreenProps } from '../../../navigation/types';
import type { Message } from '../types';

export const ChatRoomScreen = ({ route, navigation }: ChatRoomScreenProps) => {
  const { chatId } = route.params;
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore(state => state.user);
  const chatMessages = useChatStore(state => state.messages[chatId]) || [];
  const chat = useChatStore(state => state.chats.find(candidate => candidate.id === chatId));
  const isLoadingMessages = useChatStore(state => state.isLoadingMessages);
  const error = useChatStore(state => state.error);
  const fetchMessages = useChatStore(state => state.fetchMessages);
  const sendMessage = useChatStore(state => state.sendMessage);
  const markAsRead = useChatStore(state => state.markAsRead);
  const joinChat = useChatStore(state => state.joinChat);

  useEffect(() => {
    void fetchMessages(chatId);
    void markAsRead(chatId);
    joinChat(chatId);
  }, [chatId, fetchMessages, markAsRead, joinChat]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[0];
      if (lastMessage.senderId !== currentUser?.id && !lastMessage.readAt) {
        void markAsRead(chatId);
      }
    }
  }, [chatMessages, chatId, currentUser?.id, markAsRead]);

  useEffect(() => {
    if (chat) {
      const otherParticipant =
        chat.participants.find((participant) => participant.userId !== currentUser?.id)?.user ||
        chat.participants[0]?.user;
      navigation.setOptions({ title: otherParticipant?.displayName || 'Chat' });
    }
  }, [chat, currentUser?.id, navigation]);

  const handleSend = useCallback((text: string) => {
    void sendMessage(chatId, text);
  }, [chatId, sendMessage]);

  const renderItem = useCallback(({ item }: { item: Message }) => <MessageBubble message={item} />, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isLoadingMessages ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : chatMessages.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCard}>
            <Typography variant="h3" align="center">Start the conversation</Typography>
            <Typography color="textSecondary" align="center" style={styles.emptyText}>
              Messages are persisted through the backend.
            </Typography>
          </View>
        </View>
      ) : (
        <FlatList
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListFooterComponent={<Typography color="textMuted" align="center" style={styles.dateChip}>Today</Typography>}
        />
      )}
      {error ? (
        <View style={styles.error}>
          <Typography color="error" align="center">{error}</Typography>
        </View>
      ) : null}
      <ChatInput onSend={handleSend} />
      <View style={{ height: Platform.OS === 'ios' ? insets.bottom : 0, backgroundColor: theme.colors.backgroundSecondary }} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  error: {
    padding: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.error,
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  emptyCard: {
    width: '100%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  emptyText: {
    marginTop: theme.spacing.sm,
    lineHeight: 21,
  },
  dateChip: {
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginVertical: theme.spacing.sm,
  },
});

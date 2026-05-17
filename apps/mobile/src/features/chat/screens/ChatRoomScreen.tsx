import React, { useEffect, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { Typography } from '../../../shared/components/Typography';
import { colors, spacing } from '../../../shared/theme';
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
        chat.participants.find(participant => participant.userId !== currentUser?.id)?.user ||
        chat.participants[0]?.user;
      navigation.setOptions({
        title: chat.type === 'GROUP' ? (chat.name ?? 'Group') : (otherParticipant?.displayName ?? 'Chat'),
      });
    }
  }, [chat, currentUser?.id, navigation]);

  const handleSend = useCallback(
    (text: string) => {
      void sendMessage(chatId, text);
    },
    [chatId, sendMessage],
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    [],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isLoadingMessages ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : chatMessages.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyGlyph}>◐</Text>
          <Text style={styles.emptyTitle}>Начните разговор</Text>
          <Text style={styles.emptySub}>сообщения сохраняются в базе данных</Text>
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
          ListFooterComponent={
            <View style={styles.daySep}>
              <Text style={styles.daySepText}>сегодня</Text>
            </View>
          }
        />
      )}
      {error ? (
        <View style={styles.error}>
          <Typography color="error" align="center">{error}</Typography>
        </View>
      ) : null}
      <ChatInput onSend={handleSend} />
      <View
        style={{
          height: Platform.OS === 'ios' ? insets.bottom : 0,
          backgroundColor: colors.panel,
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyGlyph: {
    fontSize: 48,
    color: colors.accent,
    opacity: 0.6,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontStyle: 'italic',
    color: colors.ink2,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 11,
    color: colors.ink3,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  error: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,122,89,0.3)',
    backgroundColor: 'rgba(255,122,89,0.08)',
  },
  daySep: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  daySepText: {
    fontSize: 10,
    color: colors.ink3,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 999,
    overflow: 'hidden',
  },
});

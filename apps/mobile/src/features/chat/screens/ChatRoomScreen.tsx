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
  const joinChat = useChatStore(state => state.joinChat);

  useEffect(() => {
    void fetchMessages(chatId);
    joinChat(chatId);
  }, [chatId, fetchMessages, joinChat]);

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
          <Typography color="textSecondary">No messages yet</Typography>
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
        />
      )}
      {error ? (
        <Typography color="error" align="center" style={styles.error}>
          {error}
        </Typography>
      ) : null}
      <ChatInput onSend={handleSend} />
      <View style={{ height: Platform.OS === 'ios' ? insets.bottom : 0, backgroundColor: theme.colors.backgroundSecondary }} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  error: {
    padding: theme.spacing.sm,
  },
});

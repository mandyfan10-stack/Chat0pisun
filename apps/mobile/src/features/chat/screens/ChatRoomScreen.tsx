import { useAuthStore } from '../../auth/store/useAuthStore';
import React, { useEffect, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { theme } from '../../../shared/theme';

export const ChatRoomScreen = ({ route, navigation }: any) => {
  const { chatId } = route.params;
  const insets = useSafeAreaInsets();

  const currentUser = useAuthStore(state => state.user);
  const { messages, chats, fetchMessages, sendMessage } = useChatStore();
  const chatMessages = messages[chatId] || [];
  const chat = chats.find(c => c.id === chatId);

  useEffect(() => {
    fetchMessages(chatId);


    // Setup dynamic header title based on participant
    if (chat) {
        const otherParticipant = chat.participants.find((p: any) => p.userId !== currentUser?.id)?.user || chat.participants[0]?.user;
        navigation.setOptions({ title: otherParticipant?.displayName || 'User' });
    }
  }, [chatId]);

  const handleSend = useCallback((text: string) => {
    sendMessage(chatId, text);
  }, [chatId, sendMessage]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust based on header height
    >
      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted // Important: Starts list from bottom, handles auto-scrolling natively
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
      <ChatInput onSend={handleSend} />
      {/* Ensure padding at bottom for safe area on newer iPhones, handled by KeyboardAvoidingView/Insets */}
      <View style={{ height: Platform.OS === 'ios' ? insets.bottom : 0, backgroundColor: theme.colors.backgroundSecondary }} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF', // Standard chat background color
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
});

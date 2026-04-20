import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useChatStore } from '../store/useChatStore';
import { ChatListItem } from '../components/ChatListItem';
import { theme } from '../../../shared/theme';

export const ChatListScreen = ({ navigation }: any) => {
  // ⚡ Bolt Optimization: Use specific selectors instead of destructuring to prevent global re-renders (e.g. when messages arrive)
  const chats = useChatStore(state => state.chats);
  const fetchChats = useChatStore(state => state.fetchChats);

  useEffect(() => {
    fetchChats();
  }, []);

  // ⚡ Bolt Optimization: Use useCallback for FlatList handlers to prevent breaking React.memo on items
  const handlePressChat = React.useCallback((chatId: string) => {
    navigation.navigate('ChatRoom', { chatId });
  }, [navigation]);

  // ⚡ Bolt Optimization: Extract renderItem and wrap in useCallback, and fix typing to avoid `any`
  const renderItem = React.useCallback(({ item }: { item: any }) => (
    <ChatListItem
      chat={item}
      onPress={handlePressChat}
    />
  ), [handlePressChat]);

  if (chats.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
});

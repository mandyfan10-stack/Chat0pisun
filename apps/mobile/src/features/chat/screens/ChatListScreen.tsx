import React, { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useChatStore } from '../store/useChatStore';
import { ChatListItem } from '../components/ChatListItem';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';
import type { Chat } from '../types';
import type { ChatListScreenProps } from '../../../navigation/types';

export const ChatListScreen = ({ navigation }: ChatListScreenProps) => {
  const chats = useChatStore(state => state.chats);
  const isLoadingChats = useChatStore(state => state.isLoadingChats);
  const error = useChatStore(state => state.error);
  const fetchChats = useChatStore(state => state.fetchChats);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  const handlePress = useCallback((chatId: string) => {
    navigation.navigate('ChatRoom', { chatId });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      onPress={handlePress}
    />
  ), [handlePress]);

  if (isLoadingChats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Typography color="error" align="center">{error}</Typography>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.center}>
        <Typography color="textSecondary" align="center">No chats yet. Search for a user to start.</Typography>
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
    padding: theme.spacing.lg,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
});

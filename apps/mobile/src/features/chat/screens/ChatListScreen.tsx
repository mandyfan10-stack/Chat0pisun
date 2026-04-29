import React, { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
        <View style={styles.emptyCard}>
          <Typography variant="h3" align="center">No chats yet</Typography>
          <Typography color="textSecondary" align="center" style={styles.emptyText}>
            Search for a user to start a conversation.
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {[
          ['All', chats.length],
          ['New', 0],
          ['Personal', 0],
        ].map(([label, count], index) => (
          <TouchableOpacity
            key={label}
            style={[styles.tab, index === 0 && styles.tabActive]}
            accessibilityRole="button"
            accessibilityLabel={`${label} chats`}
          >
            <Typography color={index === 0 ? 'white' : 'textSecondary'} style={styles.tabText}>
              {label}
              {Number(count) > 0 ? ` ${count}` : ''}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
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
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
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
});

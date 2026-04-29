import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { ChatListItem } from '../components/ChatListItem';
import { Typography } from '../../../shared/components/Typography';
import { theme } from '../../../shared/theme';
import type { Chat } from '../types';
import type { ChatListScreenProps } from '../../../navigation/types';

type ChatFilter = 'all' | 'new' | 'personal' | 'work';
type ChatFolder = 'personal' | 'work';

const chatFilterLabels: Record<ChatFilter, string> = {
  all: 'All',
  new: 'New',
  personal: 'Personal',
  work: 'Work',
};

const getChatVersion = (chat: Chat) => chat.lastMessage?.id ?? chat.updatedAt;

export const ChatListScreen = ({ navigation }: ChatListScreenProps) => {
  const currentUser = useAuthStore(state => state.user);
  const chats = useChatStore(state => state.chats);
  const isLoadingChats = useChatStore(state => state.isLoadingChats);
  const error = useChatStore(state => state.error);
  const fetchChats = useChatStore(state => state.fetchChats);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [chatFolders, setChatFolders] = useState<Record<string, ChatFolder>>({});
  const [readChatVersions, setReadChatVersions] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void Promise.all([
      AsyncStorage.getItem(`nextgram.chatFolders.${currentUser.id}`),
      AsyncStorage.getItem(`nextgram.readChats.${currentUser.id}`),
    ]).then(([storedFolders, storedReadVersions]) => {
      setChatFolders(storedFolders ? JSON.parse(storedFolders) as Record<string, ChatFolder> : {});
      setReadChatVersions(storedReadVersions ? JSON.parse(storedReadVersions) as Record<string, string> : {});
    }).catch(() => {
      setChatFolders({});
      setReadChatVersions({});
    });
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      void AsyncStorage.setItem(`nextgram.chatFolders.${currentUser.id}`, JSON.stringify(chatFolders));
    }
  }, [chatFolders, currentUser]);

  useEffect(() => {
    if (currentUser) {
      void AsyncStorage.setItem(`nextgram.readChats.${currentUser.id}`, JSON.stringify(readChatVersions));
    }
  }, [currentUser, readChatVersions]);

  const getChatFolder = useCallback((chat: Chat) => chatFolders[chat.id] ?? 'personal', [chatFolders]);
  const isChatUnread = useCallback(
    (chat: Chat) => Boolean(
      currentUser &&
      chat.lastMessage &&
      chat.lastMessage.senderId !== currentUser.id &&
      readChatVersions[chat.id] !== getChatVersion(chat),
    ),
    [currentUser, readChatVersions],
  );
  const markChatAsRead = useCallback((chat: Chat) => {
    setReadChatVersions((current) => ({ ...current, [chat.id]: getChatVersion(chat) }));
  }, []);
  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (activeFilter === 'new') {
        return isChatUnread(chat);
      }

      if (activeFilter === 'personal') {
        return getChatFolder(chat) === 'personal';
      }

      if (activeFilter === 'work') {
        return getChatFolder(chat) === 'work';
      }

      return true;
    });
  }, [activeFilter, chats, getChatFolder, isChatUnread]);
  const chatTabs = useMemo(
    () =>
      (Object.keys(chatFilterLabels) as ChatFilter[]).map((filter) => ({
        filter,
        label: chatFilterLabels[filter],
        count:
          filter === 'all'
            ? chats.length
            : chats.filter((chat) => {
                if (filter === 'new') {
                  return isChatUnread(chat);
                }

                return getChatFolder(chat) === filter;
              }).length,
      })),
    [chats, getChatFolder, isChatUnread],
  );

  const handlePress = useCallback((chatId: string) => {
    const chat = chats.find((candidate) => candidate.id === chatId);
    if (chat) {
      markChatAsRead(chat);
    }

    navigation.navigate('ChatRoom', { chatId });
  }, [chats, markChatAsRead, navigation]);

  const handleToggleFolder = useCallback((chatId: string) => {
    setChatFolders((current) => ({
      ...current,
      [chatId]: current[chatId] === 'work' ? 'personal' : 'work',
    }));
  }, []);

  const renderItem = useCallback(({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      folder={getChatFolder(item)}
      isUnread={isChatUnread(item)}
      onPress={handlePress}
      onToggleFolder={handleToggleFolder}
    />
  ), [getChatFolder, handlePress, handleToggleFolder, isChatUnread]);

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
        {chatTabs.map(({ filter, label, count }) => (
          <TouchableOpacity
            key={filter}
            style={[styles.tab, activeFilter === filter && styles.tabActive]}
            onPress={() => setActiveFilter(filter)}
            accessibilityRole="button"
            accessibilityLabel={`${label} chats`}
            accessibilityState={{ selected: activeFilter === filter }}
          >
            <Typography color={activeFilter === filter ? 'white' : 'textSecondary'} style={styles.tabText}>
              {label}
              {count > 0 ? ` ${count}` : ''}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
      {filteredChats.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCard}>
            <Typography variant="h3" align="center">
              No {chatFilterLabels[activeFilter].toLowerCase()} chats
            </Typography>
            <Typography color="textSecondary" align="center" style={styles.emptyText}>
              {activeFilter === 'work'
                ? 'Use the Personal/Work chip on a chat to move it into Work.'
                : activeFilter === 'new'
                  ? 'Unread incoming messages will appear here.'
                  : 'Try another folder or start a new chat.'}
            </Typography>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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

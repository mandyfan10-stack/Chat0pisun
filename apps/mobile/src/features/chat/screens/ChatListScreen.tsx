import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { ChatListItem } from '../components/ChatListItem';
import { Typography } from '../../../shared/components/Typography';
import { colors, spacing, borderRadius } from '../../../shared/theme';
import type { Chat } from '../types';
import type { ChatListScreenProps } from '../../../navigation/types';

type ChatFilter = 'all' | 'new' | 'personal' | 'work';
type ChatFolder = 'personal' | 'work';

const chatFilterLabels: Record<ChatFilter, string> = {
  all: 'все',
  new: 'новые',
  personal: 'личные',
  work: 'работа',
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
    if (!currentUser) return;
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
    (chat: Chat) =>
      Boolean(
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
      if (activeFilter === 'new') return isChatUnread(chat);
      if (activeFilter === 'personal') return getChatFolder(chat) === 'personal';
      if (activeFilter === 'work') return getChatFolder(chat) === 'work';
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
                if (filter === 'new') return isChatUnread(chat);
                return getChatFolder(chat) === filter;
              }).length,
      })),
    [chats, getChatFolder, isChatUnread],
  );

  const handlePress = useCallback(
    (chatId: string) => {
      const chat = chats.find((candidate) => candidate.id === chatId);
      if (chat) markChatAsRead(chat);
      navigation.navigate('ChatRoom', { chatId });
    },
    [chats, markChatAsRead, navigation],
  );

  const handleToggleFolder = useCallback((chatId: string) => {
    setChatFolders((current) => ({
      ...current,
      [chatId]: current[chatId] === 'work' ? 'personal' : 'work',
    }));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Chat }) => (
      <ChatListItem
        chat={item}
        folder={getChatFolder(item)}
        isUnread={isChatUnread(item)}
        onPress={handlePress}
        onToggleFolder={handleToggleFolder}
      />
    ),
    [getChatFolder, handlePress, handleToggleFolder, isChatUnread],
  );

  if (isLoadingChats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
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
        <Text style={styles.emptyGlyph}>◐</Text>
        <Text style={styles.emptyTitle}>нет чатов</Text>
        <Text style={styles.emptySub}>найдите пользователя чтобы начать</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
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
            <Text style={[styles.tabText, activeFilter === filter && styles.tabTextActive]}>
              {label}
              {count > 0 ? ` ${count}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredChats.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>нет {chatFilterLabels[activeFilter]} чатов</Text>
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
    backgroundColor: colors.canvas,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.canvas,
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
    fontSize: 12,
    color: colors.ink3,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: colors.panel2,
  },
  tabText: {
    fontSize: 12,
    color: colors.ink3,
    fontFamily: 'monospace',
  },
  tabTextActive: {
    color: colors.ink,
  },
});

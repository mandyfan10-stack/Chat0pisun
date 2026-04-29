import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Typography } from '../../../shared/components/Typography';
import { Avatar } from '../../../shared/components/Avatar';
import { apiRequest } from '../../../shared/api/client';
import { useChatStore } from '../store/useChatStore';
import type { User } from '../types';
import type { SearchScreenProps } from '../../../navigation/types';
import { theme } from '../../../shared/theme';

export const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startChat = useChatStore(state => state.startChat);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setError(null);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (text.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const users = await apiRequest<User[]>(`/api/users/search?q=${encodeURIComponent(text.trim())}`);
        setResults(users);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleStartChat = async (targetUserId: string) => {
    try {
      const chat = await startChat(targetUserId);
      navigation.replace('ChatRoom', { chatId: chat.id });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to start chat');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search users"
        placeholderTextColor={theme.colors.textMuted}
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
        accessibilityLabel="Search users"
      />
      {isSearching ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Typography color="error">{error}</Typography>
        </View>
      ) : null}
      {!isSearching && query.trim().length >= 2 && results.length === 0 && !error ? (
        <View style={styles.emptyCard}>
          <Typography color="textSecondary" align="center">No users found</Typography>
        </View>
      ) : null}
      <FlatList
        data={results}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => void handleStartChat(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Start chat with ${item.displayName}`}
          >
            <Avatar name={item.displayName} uri={item.avatarUrl ?? undefined} size={44} />
            <View style={styles.itemText}>
              <Typography variant="h3" numberOfLines={1}>{item.displayName}</Typography>
              <Typography color="textSecondary" numberOfLines={1}>@{item.username}</Typography>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.input,
    color: theme.colors.text,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  itemText: {
    flex: 1,
  },
  errorBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  emptyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
});

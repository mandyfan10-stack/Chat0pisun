import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Typography } from '../../../shared/components/Typography';
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
        placeholder="Search users..."
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
        accessibilityLabel="Search users"
      />
      {isSearching ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {error ? <Typography color="error">{error}</Typography> : null}
      {!isSearching && query.trim().length >= 2 && results.length === 0 && !error ? (
        <Typography color="textSecondary">No users found</Typography>
      ) : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => void handleStartChat(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Start chat with ${item.displayName}`}
          >
            <Typography>{item.displayName} (@{item.username})</Typography>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 16 },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
});

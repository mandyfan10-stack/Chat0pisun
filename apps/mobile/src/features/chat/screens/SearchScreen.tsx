import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Typography } from '../../../shared/components/Typography';
import { API_URL } from '../../../config/env';

export const SearchScreen = ({ navigation }: any) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const token = useAuthStore(state => state.token);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 2) return setResults([]);

        try {
            const res = await fetch(`${API_URL}/api/users/search?q=${text}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setResults(data);
        } catch (e) {
            console.error(e);
        }
    };

    const startChat = async (targetUserId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId })
            });
            const chat = await res.json();
            navigation.replace('ChatRoom', { chatId: chat.id });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Search users..."
                value={query}
                onChangeText={handleSearch}
            />
            <FlatList
                data={results}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => startChat(item.id)}>
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
    item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }
});

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/features/auth/store/useAuthStore';
import { useChatStore } from './src/features/chat/store/useChatStore';

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const restoreToken = useAuthStore((state) => state.restoreToken);
  const initSocket = useChatStore((state) => state.initSocket);
  const disconnectSocket = useChatStore((state) => state.disconnectSocket);

  useEffect(() => {
    void restoreToken();
  }, [restoreToken]);

  useEffect(() => {
    if (user) {
      initSocket();
      return;
    }

    disconnectSocket();
  }, [disconnectSocket, initSocket, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

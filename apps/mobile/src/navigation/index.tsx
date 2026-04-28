import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { ChatListScreen } from '../features/chat/screens/ChatListScreen';
import { ChatRoomScreen } from '../features/chat/screens/ChatRoomScreen';
import { SearchScreen } from '../features/chat/screens/SearchScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { theme } from '../shared/theme';
import type { BottomTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => navigation.getParent()?.navigate('Search')}
              accessibilityRole="button"
              accessibilityLabel="Search users"
            >
              <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.backgroundSecondary },
        headerTintColor: theme.colors.text,
        headerBackVisible: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'Search Users', headerBackVisible: true }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{
              title: 'Chat',
              headerBackVisible: true,
              headerRight: () => (
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chat options">
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              ),
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import { ChatListScreen } from '../features/chat/screens/ChatListScreen';
import { ChatRoomScreen } from '../features/chat/screens/ChatRoomScreen';
import { SearchScreen } from '../features/chat/screens/SearchScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { theme } from '../shared/theme';

const Stack = createNativeStackNavigator<any>();
const Tab = createBottomTabNavigator<any>();

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
        options={({ navigation }: any) => ({
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
          headerRight: () => (
             <TouchableOpacity style={{ marginRight: 15 }} onPress={() => navigation.navigate('Search')}>
                 <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.primary} />
             </TouchableOpacity>
          )
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
  return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.backgroundSecondary },
          headerTintColor: theme.colors.text,
          headerBackVisible: false,
        }}
      >
        <Stack.Screen
          name="Main"
          component={BottomTabs}
          options={{ headerShown: false }}
        />
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
              <MaterialCommunityIcons
                name="dots-vertical"
                size={24}
                color={theme.colors.primary}
              />
            ),
          }}
        />
      </Stack.Navigator>
  );
};

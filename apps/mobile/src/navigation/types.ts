import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type BottomTabParamList = {
  Chats: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<BottomTabParamList> | undefined;
  Search: undefined;
  ChatRoom: { chatId: string };
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type ChatRoomScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;
export type ChatListScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Chats'>,
  NativeStackScreenProps<RootStackParamList>
>;

import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Chats: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<BottomTabParamList>;
  ChatRoom: { chatId: string };
};

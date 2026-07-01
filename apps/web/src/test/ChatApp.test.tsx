import { describe, it, expect, vi, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import ChatApp from '../pages/ChatApp';
import { useAuthStore, useChatStore } from '../store/useStore';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../store/useStore', () => ({
  useAuthStore: vi.fn(),
  useChatStore: vi.fn(),
}));

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  SOCKET_URL: 'http://localhost:4000',
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe('ChatApp Component', () => {
  it('renders welcome message when no chat is selected', () => {
    const authState = {
      user: { username: 'alice', displayName: 'Alice' },
      accessToken: 'token',
      logout: vi.fn(),
      updateUserPresence: vi.fn(),
    };

    const chatState = {
      chats: [],
      activeChatId: null,
      messages: {},
      isLoadingChats: false,
      fetchChats: vi.fn(),
      setActiveChatId: vi.fn(),
      fetchMessages: vi.fn(),
      markAsRead: vi.fn(),
      addMessage: vi.fn(),
      upsertChat: vi.fn(),
      markMessagesAsRead: vi.fn(),
    };

    (useAuthStore as unknown as Mock).mockImplementation(
      (selector: (state: typeof authState) => unknown) => selector(authState),
    );
    (useAuthStore as unknown as { getState: () => typeof authState }).getState = () => authState;

    (useChatStore as unknown as Mock).mockImplementation(
      (selector: (state: typeof chatState) => unknown) => selector(chatState),
    );
    (useChatStore as unknown as { getState: () => typeof chatState }).getState = () => chatState;

    const { getByText } = render(
      <MemoryRouter>
        <ChatApp />
      </MemoryRouter>,
    );

    expect(getByText('Выберите эфир слева')).toBeDefined();
    expect(
      getByText('или начните новый ⌘N'),
    ).toBeDefined();
  });
});

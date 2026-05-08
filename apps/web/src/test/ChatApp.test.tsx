import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('ChatApp Component', () => {
  it('renders welcome message when no chat is selected', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuthStore as unknown as Mock).mockImplementation((selector: any) => selector({
      user: { username: 'alice', displayName: 'Alice' },
      accessToken: 'token',
      logout: vi.fn(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useChatStore as unknown as Mock).mockImplementation((selector: any) => selector({
      chats: [],
      activeChatId: null,
      messages: {},
      isLoadingChats: false,
      fetchChats: vi.fn(),
      setActiveChatId: vi.fn(),
    }));

    render(
      <MemoryRouter>
        <ChatApp />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome to Nextgram')).toBeDefined();
    expect(screen.getByText('Select a chat or find a user to begin a private conversation.')).toBeDefined();
  });
});

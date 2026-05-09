import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useAuthStore, useChatStore } from './useStore';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  getStoredTokens: vi.fn(() => ({ accessToken: 'at', refreshToken: 'rt' })),
  setStoredTokens: vi.fn(),
  clearStoredTokens: vi.fn(),
  setAuthFailureHandler: vi.fn(),
}));

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().resetChats();
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const state = useChatStore.getState();
    expect(state.chats).toEqual([]);
    expect(state.activeChatId).toBeNull();
  });

  it('upserts chats and sorts them by updatedAt', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chat1 = { id: '1', updatedAt: '2026-05-01T10:00:00Z', participants: [], lastMessage: null, createdAt: '' } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chat2 = { id: '2', updatedAt: '2026-05-02T10:00:00Z', participants: [], lastMessage: null, createdAt: '' } as any;

    useChatStore.getState().upsertChat(chat1);
    useChatStore.getState().upsertChat(chat2);

    const state = useChatStore.getState();
    expect(state.chats).toHaveLength(2);
    expect(state.chats[0].id).toBe('2'); // Newer first
  });

  it('adds messages and avoids duplicates', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = { id: 'm1', chatId: 'c1', senderId: 'u1', text: 'hi', createdAt: '2026-05-01T10:00:00Z', updatedAt: null, readAt: null } as any;
    
    useChatStore.getState().addMessage(message);
    useChatStore.getState().addMessage(message); // Duplicate

    const state = useChatStore.getState();
    expect(state.messages['c1']).toHaveLength(1);
    expect(state.messages['c1'][0].text).toBe('hi');
  });

  it('marks messages as read locally', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg1 = { id: 'm1', chatId: 'c1', senderId: 'other', text: 'hi', createdAt: '...', updatedAt: null, readAt: null } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg2 = { id: 'm2', chatId: 'c1', senderId: 'me', text: 'hello', createdAt: '...', updatedAt: null, readAt: null } as any;
    
    useChatStore.setState({ messages: { 'c1': [msg1, msg2] } });

    useChatStore.getState().markMessagesAsRead('c1', 'me', '2026-05-08T12:00:00Z');

    const state = useChatStore.getState();
    expect(state.messages['c1'][0].readAt).toBe('2026-05-08T12:00:00Z'); // 'other' message read
    expect(state.messages['c1'][1].readAt).toBeNull(); // 'me' message unchanged
  });
});

describe('useAuthStore', () => {
  it('updates profile and user state', async () => {
    const updatedUser = { id: '1', username: 'alice', displayName: 'Alice Updated' };
    (api.patch as Mock).mockResolvedValue({ data: { user: updatedUser } });

    await useAuthStore.getState().updateProfile({ displayName: 'Alice Updated' });

    expect(useAuthStore.getState().user?.displayName).toBe('Alice Updated');
    expect(api.patch).toHaveBeenCalledWith('/users/me', { displayName: 'Alice Updated' });
  });

  it('updates user presence', () => {
    const { updateUserPresence } = useAuthStore.getState();
    
    updateUserPresence('user-1', 'online');
    expect(useAuthStore.getState().usersPresence['user-1']).toBe('online');
    
    updateUserPresence('user-1', 'offline');
    expect(useAuthStore.getState().usersPresence['user-1']).toBe('offline');
  });
});

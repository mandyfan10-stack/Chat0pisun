import { useChatStore } from './useChatStore';
import { apiRequest } from '../../../shared/api/client';

jest.mock('../../../shared/api/client', () => ({
  apiRequest: jest.fn(),
  setAuthFailureHandler: jest.fn(),
  setSessionUpdateHandler: jest.fn(),
}));

describe('useChatStore mobile', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const state = useChatStore.getState();
    expect(state.chats).toEqual([]);
    expect(state.socket).toBeNull();
  });

  it('upserts chats and sorts them by updatedAt', () => {
    const chat1 = { id: '1', updatedAt: '2026-05-01T10:00:00Z', participants: [], lastMessage: null, createdAt: '' };
    const chat2 = { id: '2', updatedAt: '2026-05-02T10:00:00Z', participants: [], lastMessage: null, createdAt: '' };

    useChatStore.getState().upsertChat(chat1);
    useChatStore.getState().upsertChat(chat2);

    const state = useChatStore.getState();
    expect(state.chats).toHaveLength(2);
    expect(state.chats[0].id).toBe('2');
  });

  it('marks messages as read locally', () => {
    const msg1 = { id: 'm1', chatId: 'c1', senderId: 'other', text: 'hi', createdAt: '...', updatedAt: null, readAt: null };
    const msg2 = { id: 'm2', chatId: 'c1', senderId: 'me', text: 'hello', createdAt: '...', updatedAt: null, readAt: null };
    
    useChatStore.setState({ messages: { 'c1': [msg1, msg2] } });

    useChatStore.getState().markMessagesAsRead('c1', 'me', '2026-05-08T12:00:00Z');

    const state = useChatStore.getState();
    expect(state.messages['c1'][0].readAt).toBe('2026-05-08T12:00:00Z');
    expect(state.messages['c1'][1].readAt).toBeNull();
  });

  it('starts chat and calls apiRequest', async () => {
    const newChat = { id: 'new', participants: [], lastMessage: null, updatedAt: '...', createdAt: '...' };
    (apiRequest as jest.Mock).mockResolvedValue(newChat);

    await useChatStore.getState().startChat('target-user-id');

    expect(apiRequest).toHaveBeenCalledWith('/api/chats', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ targetUserId: 'target-user-id' }),
    }));
    expect(useChatStore.getState().chats).toHaveLength(1);
    expect(useChatStore.getState().chats[0].id).toBe('new');
  });
});

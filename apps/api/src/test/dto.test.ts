import { toChatDto, toMessageDto } from '../utils/dto';

describe('DTO Mappers', () => {
  describe('toChatDto', () => {
    const mockDate = new Date('2023-01-01T00:00:00Z');

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      bio: null,
      lastSeen: mockDate,
      createdAt: mockDate,
    };

    const mockParticipant = {
      id: 'participant-1',
      chatId: 'chat-1',
      userId: 'user-1',
      createdAt: mockDate,
      user: mockUser,
    };

    const mockChatBase = {
      id: 'chat-1',
      createdAt: mockDate,
      updatedAt: mockDate,
      participants: [mockParticipant],
    };

    it('should handle undefined messages gracefully', () => {
      const chat = { ...mockChatBase }; // No messages property
      const dto = toChatDto(chat as any);

      expect(dto.id).toBe('chat-1');
      expect(dto.participants).toHaveLength(1);
      expect(dto.lastMessage).toBeNull();
    });

    it('should handle empty messages array gracefully', () => {
      const chat = { ...mockChatBase, messages: [] };
      const dto = toChatDto(chat as any);

      expect(dto.id).toBe('chat-1');
      expect(dto.participants).toHaveLength(1);
      expect(dto.lastMessage).toBeNull();
    });

    it('should correctly map the last message if present', () => {
      const mockMessage = {
        id: 'message-1',
        chatId: 'chat-1',
        senderId: 'user-1',
        text: 'Hello world',
        createdAt: mockDate,
        updatedAt: null,
        readAt: null,
      };
      const chat = { ...mockChatBase, messages: [mockMessage] };
      const dto = toChatDto(chat as any);

      expect(dto.id).toBe('chat-1');
      expect(dto.participants).toHaveLength(1);
      expect(dto.lastMessage).toEqual(toMessageDto(mockMessage as any));
    });
  });
});

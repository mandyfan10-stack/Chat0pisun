import { type Chat, type Participant } from '../../store/useStore';

export const getOtherParticipant = (chat: Chat, currentUserId: string): Participant | undefined => {
  return chat.participants.find((participant) => participant.userId !== currentUserId) ?? chat.participants[0];
};

export const formatTime = (value?: string) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

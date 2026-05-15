/**
 * ChatTabs types and constants extracted from ChatTabs.tsx
 * to satisfy react-refresh/only-export-components rule
 */
export type ChatFilter = 'all' | 'new' | 'personal' | 'work';

export const chatFilterLabels: Record<ChatFilter, string> = {
  all: 'All',
  new: 'New',
  personal: 'Personal',
  work: 'Work',
};

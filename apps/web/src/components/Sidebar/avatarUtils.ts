/**
 * Avatar utility functions extracted from Avatar.tsx
 * to satisfy react-refresh/only-export-components rule
 * (a file can only export React components OR non-component values, not both)
 */
export const getInitials = (name?: string): string => {
  const safeName = name?.trim() || 'User';
  return safeName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

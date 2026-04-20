import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Typography } from './Typography';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
}

// ⚡ Bolt Optimization: Memoize Avatar to prevent re-rendering when parent components re-render without props changes
export const Avatar: React.FC<AvatarProps> = React.memo(({ uri, name, size = 48 }) => {
  // ⚡ Bolt Optimization: Memoize initials derivation to avoid recalculating string operations on every re-render
  const initials = React.useMemo(() => {
    const safeName = name || 'U';
    return safeName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Typography variant="h3" color="white">
        {initials}
      </Typography>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.border,
  },
  placeholder: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

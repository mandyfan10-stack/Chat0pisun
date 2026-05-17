import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { API_URL } from '../../config/env';

const AVATAR_TINTS: [string, string][] = [
  ['#ff7a59', '#2a1410'],
  ['#c5ff2e', '#1a1f0a'],
  ['#7cc7ff', '#0e1a25'],
  ['#ffb84d', '#241608'],
  ['#e08aff', '#1d0e25'],
  ['#5cffb4', '#0a2018'],
];

function tintFor(s: string): [string, string] {
  let h = 0;
  for (const c of s) h = ((h * 31 + c.charCodeAt(0)) | 0);
  return AVATAR_TINTS[Math.abs(h) % AVATAR_TINTS.length];
}

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = React.memo(({ uri, name, size = 48 }) => {
  const safeName = name || 'U';

  const initials = useMemo(() => {
    return safeName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [safeName]);

  const sourceUri = useMemo(() => {
    if (!uri) return null;
    return uri.startsWith('http') ? uri : `${API_URL}${uri}`;
  }, [uri]);

  const [bg, fg] = tintFor(safeName);
  const radius = size * 0.28;

  if (sourceUri) {
    return (
      <Image
        source={{ uri: sourceUri }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: fg,
            fontSize: size * 0.36,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'serif',
    fontWeight: '400',
    letterSpacing: -0.5,
  },
});

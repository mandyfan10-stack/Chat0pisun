import React from 'react';
import { Text, TextProps } from 'react-native';
import { theme } from '../theme';

interface TypographyProps extends TextProps {
  variant?: keyof typeof theme.typography;
  color?: keyof typeof theme.colors;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'text',
  align = 'left',
  style,
  ...props
}) => {
  return (
    <Text
      style={[
        theme.typography[variant],
        { color: theme.colors[color], textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

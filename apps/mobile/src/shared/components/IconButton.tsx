import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

interface IconButtonProps extends TouchableOpacityProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 24,
  color = theme.colors.primary,
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      {...props}
    >
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

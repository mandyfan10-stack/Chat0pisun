import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { theme } from '../../../shared/theme';
import { IconButton } from '../../../shared/components/IconButton';

interface ChatInputProps {
  onSend: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      // Optional: Dismiss keyboard on send, or keep it open. Usually kept open in messengers.
    }
  };

  return (
    <View style={styles.container}>
      <IconButton icon="plus" color={theme.colors.primary} />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
      </View>

      {text.trim().length > 0 ? (
        <IconButton
          icon="send-circle"
          color={theme.colors.primary}
          size={32}
          onPress={handleSend}
        />
      ) : (
        <IconButton icon="microphone-outline" color={theme.colors.textSecondary} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    marginHorizontal: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    minHeight: 40,
    maxHeight: 120, // Limit multiline growth
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: theme.colors.text,
    paddingTop: 0,
    paddingBottom: 0,
  },
});

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  compact = false,
  accessibilityLabel,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        compact && styles.compact,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'outline' ? colors.navy : colors.white} /> : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 46, paddingHorizontal: 16, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 8, flexDirection: 'row' },
  compact: { alignSelf: 'flex-start', minHeight: 37, borderRadius: 11, paddingHorizontal: 14 },
  primary: { backgroundColor: colors.blue },
  secondary: { backgroundColor: '#EEF2F8' },
  success: { backgroundColor: colors.green },
  danger: { backgroundColor: colors.red },
  outline: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: '800', color: colors.white },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.ink },
  successLabel: { color: colors.white },
  dangerLabel: { color: colors.white },
  outlineLabel: { color: colors.navy },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});

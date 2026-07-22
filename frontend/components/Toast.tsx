import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

const ACCENT_BY_TYPE: Record<ToastType, string> = {
  success: colors.success,
  error: colors.live,
  info: colors.accent,
};

interface ToastItemProps {
  toast: ToastMessage;
}

export function ToastItem({ toast }: ToastItemProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: ACCENT_BY_TYPE[toast.type], opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={[typography.body, styles.text]}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  text: {
    color: colors.textPrimary,
  },
});

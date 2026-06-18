import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface IconButtonProps {
  onPress: () => void;
  /** Glifo o texto corto (p. ej. "‹" para back, "✕" para cerrar). */
  glyph?: string;
  accessibilityLabel: string;
  style?: ViewStyle;
}

/**
 * Botón circular para back / cerrar, con área táctil mínima ~44x44.
 */
export function IconButton({
  onPress,
  glyph = '‹',
  accessibilityLabel,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null, style]}
    >
      <Text style={styles.glyph}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  glyph: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
  },
});

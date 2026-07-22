import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.border, fg: colors.textSecondary },
  accent: { bg: 'rgba(198, 255, 26, 0.15)', fg: colors.accent },
  success: { bg: 'rgba(46, 204, 113, 0.15)', fg: colors.success },
  danger: { bg: 'rgba(255, 59, 48, 0.15)', fg: colors.live },
  warning: { bg: 'rgba(245, 197, 24, 0.15)', fg: '#F5C518' },
};

/**
 * Etiqueta compacta para estados (pendiente, finalizado, activo, etc.).
 */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

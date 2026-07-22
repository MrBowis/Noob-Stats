import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface StatTileProps {
  value: string | number;
  label: string;
  /** Color del valor; por defecto el acento. */
  valueColor?: string;
}

/**
 * Bloque compacto de estadística: un número grande y una etiqueta.
 */
export function StatTile({ value, label, valueColor }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.background,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accent,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

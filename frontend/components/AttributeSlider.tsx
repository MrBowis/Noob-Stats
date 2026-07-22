import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface AttributeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Salto de cada pulsación. */
  step?: number;
}

const MIN = 0;
const MAX = 100;

/**
 * Control 0-100 para un atributo deportivo: barra de progreso con botones
 * de decremento/incremento. Recorta siempre al rango válido del backend.
 */
export function AttributeSlider({
  label,
  value,
  onChange,
  step = 5,
}: AttributeSliderProps) {
  const set = (next: number) =>
    onChange(Math.max(MIN, Math.min(MAX, Math.round(next))));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Disminuir ${label}`}
          onPress={() => set(value - step)}
          disabled={value <= MIN}
          hitSlop={6}
          style={[styles.btn, value <= MIN ? styles.btnDisabled : null]}
        >
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${value}%` }]} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          onPress={() => set(value + step)}
          disabled={value >= MAX}
          hitSlop={6}
          style={[styles.btn, value >= MAX ? styles.btnDisabled : null]}
        >
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  value: { fontSize: 18, fontWeight: '800', color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent },
});

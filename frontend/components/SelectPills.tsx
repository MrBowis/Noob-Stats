import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectPillsProps<T extends string> {
  label?: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Selector segmentado tipo píldora (mismo patrón que el selector de rol en el
 * registro). Genérico sobre el valor.
 */
export function SelectPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: SelectPillsProps<T>) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[typography.overline, styles.label]}>{label}</Text>
      ) : null}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected ? styles.optionSelected : null]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: selected ? colors.accentText : colors.textPrimary },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

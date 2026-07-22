import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export interface SelectFieldOption<T extends string> {
  label: string;
  value: T;
}

interface SelectFieldProps<T extends string> {
  label: string;
  options: readonly SelectFieldOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  /** Permite dejar el campo sin valor desde el propio selector. */
  clearable?: boolean;
  errorText?: string;
}

/**
 * Selector desplegable para catálogos largos (donde SelectPills no cabe),
 * como la parte del cuerpo de una lesión.
 */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  clearable = false,
  errorText,
}: SelectFieldProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const seleccionada = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={[typography.overline, styles.label]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${seleccionada?.label ?? placeholder}`}
        onPress={() => setAbierto(true)}
        style={[styles.input, errorText ? styles.inputError : null]}
      >
        <Text
          style={[styles.inputText, !seleccionada ? styles.placeholder : null]}
        >
          {seleccionada?.label ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAbierto(false)} />
        <View style={styles.sheet}>
          <Text style={[typography.overline, styles.sheetTitle]}>{label}</Text>
          <ScrollView>
            {clearable ? (
              <Pressable
                onPress={() => {
                  onChange(null);
                  setAbierto(false);
                }}
                style={styles.option}
              >
                <Text style={[styles.optionText, styles.placeholder]}>
                  {placeholder}
                </Text>
              </Pressable>
            ) : null}
            {options.map((option) => {
              const activo = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  onPress={() => {
                    onChange(option.value);
                    setAbierto(false);
                  }}
                  style={styles.option}
                >
                  <Text
                    style={[
                      styles.optionText,
                      activo ? styles.optionTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {activo ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.accent}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  inputError: { borderColor: colors.live },
  inputText: { color: colors.textPrimary, fontSize: 16 },
  placeholder: { color: colors.textSecondary },
  error: { ...typography.body, color: colors.live, marginTop: spacing.xs },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '15%',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { color: colors.textPrimary, fontSize: 15 },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
});

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
}

/**
 * Input del sistema visual: fondo surface, esquinas redondeadas y label
 * superior en estilo overline. Si `secureTextEntry` es true, muestra un
 * icono de ojo para alternar la visibilidad del texto.
 */
export function TextField({
  label,
  errorText,
  style,
  secureTextEntry,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={[typography.overline, styles.label]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          {...inputProps}
          secureTextEntry={isPasswordField && !visible}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[
            styles.input,
            focused ? styles.inputFocused : null,
            errorText ? styles.inputError : null,
            isPasswordField ? styles.inputWithIcon : null,
            style,
          ]}
        />
        {isPasswordField ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            style={styles.eyeButton}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
  },
  inputRow: {
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
    color: colors.textPrimary,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: spacing.xl + spacing.lg,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.live,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.lg,
    height: 52,
    justifyContent: 'center',
  },
  error: {
    ...typography.body,
    color: colors.live,
    marginTop: spacing.xs,
  },
});

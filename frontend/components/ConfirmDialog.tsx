import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pinta la acción principal en rojo (borrar, salir, etc.). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación multiplataforma. `Alert.alert` no está implementado en
 * react-native-web, así que las acciones destructivas no llegaban a
 * ejecutarse en el navegador.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        {message ? (
          <Text style={[typography.body, styles.message]}>{message}</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [
              styles.button,
              styles.cancel,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.button,
              destructive ? styles.destructive : styles.confirm,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.confirmLabel,
                destructive ? styles.destructiveLabel : null,
              ]}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    top: '35%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  message: { marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  button: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirm: { backgroundColor: colors.accent },
  destructive: { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
  pressed: { opacity: 0.85 },
  cancelLabel: {
    ...typography.buttonLabel,
    color: colors.textPrimary,
  },
  confirmLabel: {
    ...typography.buttonLabel,
    color: colors.accentText,
  },
  destructiveLabel: { color: colors.live },
});

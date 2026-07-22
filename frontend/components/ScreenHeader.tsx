import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Icono de acción a la derecha (Ionicons name). */
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Encabezado de pantalla con botón de retroceso opcional y una acción a la
 * derecha (por ejemplo, editar). Sigue el estilo overline + title del sistema.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  actionIcon,
  onAction,
  actionLabel,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBack}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}

        {actionIcon && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel ?? 'Acción'}
            onPress={onAction}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons name={actionIcon} size={20} color={colors.accent} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      <Text style={typography.overline}>Noob Stats</Text>
      <Text style={typography.title}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.body, styles.subtitle]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});

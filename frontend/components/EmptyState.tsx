import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

/**
 * Estado vacío con icono, título y mensaje de ayuda para listas sin datos.
 */
export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {message ? (
        <Text style={[typography.body, styles.message]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

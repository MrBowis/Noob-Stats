import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { colors, radius, spacing, typography } from '../../../theme';

export default function AdminHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Administración"
          subtitle="Gestiona los usuarios y roles de la plataforma."
          onBack={() => router.back()}
        />

        <NavCard
          icon="people-outline"
          title="Usuarios"
          subtitle="Crear, editar y desactivar usuarios"
          onPress={() => router.push('/(app)/admin/usuarios')}
        />
        <NavCard
          icon="ribbon-outline"
          title="Roles"
          subtitle="Administrar los roles del sistema"
          onPress={() => router.push('/(app)/admin/roles')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function NavCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.navCard,
        pressed ? styles.navCardPressed : null,
      ]}
    >
      <View style={styles.navIcon}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.navInfo}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={typography.body}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  navCardPressed: { opacity: 0.85 },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navInfo: { flex: 1, gap: spacing.xs },
  navTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
});

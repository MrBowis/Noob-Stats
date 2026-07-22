import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

interface NavTab {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  /** Prefijo de ruta que marca la pestaña como activa. */
  match: string;
}

/**
 * Barra de navegación inferior con las secciones principales según el rol.
 * El perfil y las invitaciones viven en el drawer.
 */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const rol = profile?.rol.nombreRol;
  const tabs: NavTab[] = [
    {
      label: 'Inicio',
      icon: 'stats-chart-outline',
      route: '/(app)/dashboard',
      match: '/dashboard',
    },
  ];

  if (rol === 'Entrenador' || rol === 'Futbolista') {
    tabs.push({
      label: 'Equipos',
      icon: 'shield-outline',
      route: '/(app)/equipos',
      match: '/equipos',
    });
    tabs.push({
      label: 'Jugadores',
      icon: 'people-outline',
      route: '/(app)/jugadores',
      match: '/jugadores',
    });
  }
  if (rol === 'Futbolista') {
    tabs.push({
      label: 'Mi perfil',
      icon: 'football-outline',
      route: '/(app)/jugadores/mi-perfil',
      match: '/jugadores/mi-perfil',
    });
  }
  if (rol === 'Administrador') {
    tabs.push({
      label: 'Admin',
      icon: 'settings-outline',
      route: '/(app)/admin',
      match: '/admin',
    });
  }

  if (tabs.length < 2) return null;

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      {tabs.map((tab) => {
        // "Mi perfil" es más específico que "Jugadores": gana la coincidencia
        // más larga para no marcar dos pestañas a la vez.
        const activo =
          pathname.startsWith(tab.match) &&
          !tabs.some(
            (otro) =>
              otro !== tab &&
              otro.match.length > tab.match.length &&
              pathname.startsWith(otro.match),
          );
        const color = activo ? colors.accent : colors.textSecondary;

        return (
          <Pressable
            key={tab.route}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={tab.label}
            onPress={() => router.push(tab.route)}
            style={styles.tab}
          >
            <Ionicons name={tab.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

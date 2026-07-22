import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.8, 320);

/**
 * Menú lateral (drawer) personalizado, sin dependencias nativas. Muestra
 * información rápida del usuario, navegación según su rol, acceso al perfil y
 * la opción de cerrar sesión.
 */
export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [translateX] = useState(() => new Animated.Value(-PANEL_WIDTH));
  const [backdrop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateX.setValue(-PANEL_WIDTH);
      backdrop.setValue(0);
    }
  }, [visible, translateX, backdrop]);

  const rol = profile?.rol.nombreRol;
  const isFutbolista = rol === 'Futbolista';

  // El resto de secciones vive en la barra inferior (<BottomNav />).
  const navItems: NavItem[] = [];
  if (isFutbolista) {
    navItems.push({
      label: 'Mis invitaciones',
      icon: 'mail-outline',
      route: '/(app)/invitaciones',
    });
  }

  const go = (route: string) => {
    onClose();
    router.push(route);
  };

  const onSignOut = () => {
    onClose();
    void (async () => {
      await signOut();
      router.replace('/(auth)/login');
    })();
  };

  const nombreCompleto = profile
    ? `${profile.persona.nombres} ${profile.persona.apellidos}`.trim()
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.panel, { transform: [{ translateX }] }]}
      >
        <SafeAreaView style={styles.panelInner} edges={['top', 'left', 'bottom']}>
          {/* Info rápida del usuario */}
          <View style={styles.userBox}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={26} color={colors.accent} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {nombreCompleto || 'Usuario'}
            </Text>
            {rol ? (
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{rol}</Text>
              </View>
            ) : null}
            <Text style={styles.userEmail} numberOfLines={1}>
              {profile?.usuario.email ?? ''}
            </Text>
          </View>

          {/* Navegación */}
          <View style={styles.nav}>
            <DrawerItem
              icon="person-circle-outline"
              label="Perfil"
              onPress={() => go('/(app)/perfil')}
            />
            {navItems.map((item) => (
              <DrawerItem
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => go(item.route)}
              />
            ))}
          </View>

          <View style={styles.spacer} />

          <DrawerItem
            icon="log-out-outline"
            label="Cerrar sesión"
            danger
            onPress={onSignOut}
          />
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? colors.live : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}
    >
      <Ionicons name={icon} size={22} color={danger ? colors.live : colors.accent} />
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
    </Pressable>
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
  backdropPress: { flex: 1 },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  panelInner: { flex: 1, padding: spacing.xl },
  userBox: {
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  userName: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(198, 255, 26, 0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: { ...typography.body },
  nav: { marginTop: spacing.lg, gap: spacing.xs },
  spacer: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.input,
  },
  itemPressed: { backgroundColor: colors.background },
  itemLabel: { fontSize: 15, fontWeight: '600' },
});

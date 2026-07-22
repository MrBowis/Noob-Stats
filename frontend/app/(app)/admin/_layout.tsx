import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../theme';

/**
 * Guard de rol para toda la sección de administración: solo los usuarios con
 * rol "Administrador" pueden acceder. El grupo (app) ya garantiza que exista
 * sesión; aquí verificamos además el rol.
 *
 * Es una protección de UX; el backend (admin-ms) valida el rol en cada
 * petición y responde 403 si no es Administrador.
 */
export default function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (profile?.rol.nombreRol !== 'Administrador') {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { GOOGLE_ROL_KEY, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { colors } from '../theme';

// En nativo cierra el popup de OAuth y devuelve la URL al opener.
// Debe estar en el nivel de módulo para ejecutarse antes del primer render.
WebBrowser.maybeCompleteAuthSession();

/**
 * Retorno del flujo OAuth.
 *
 * En web la app navega la propia pestaña hacia Google, así que es esta
 * pantalla la que recibe los tokens en el fragmento de la URL y termina de
 * abrir la sesión. En nativo no hace nada: de eso se encarga el popup.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { completeGoogleSession } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const url = window.location.href;
    if (!url.includes('access_token')) return;

    let activo = true;
    void (async () => {
      try {
        const rol = window.sessionStorage.getItem(GOOGLE_ROL_KEY) ?? undefined;
        window.sessionStorage.removeItem(GOOGLE_ROL_KEY);

        await completeGoogleSession(url, rol);

        // Quita los tokens de la barra de direcciones antes de continuar.
        window.history.replaceState(null, '', window.location.pathname);
        if (activo) router.replace('/(app)/dashboard');
      } catch (e) {
        if (!activo) return;
        showToast(
          e instanceof Error ? e.message : 'No se pudo completar el acceso',
          'error',
        );
        router.replace('/(auth)/login');
      }
    })();

    return () => {
      activo = false;
    };
  }, [completeGoogleSession, router, showToast]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

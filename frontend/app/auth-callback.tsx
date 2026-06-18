import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// Cierra el popup de OAuth en web y devuelve la URL al opener.
// En native nunca se monta; el deep link lo maneja el SO.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  useEffect(() => {
    // Segundo intento en caso de que el componente monte después del módulo.
    WebBrowser.maybeCompleteAuthSession();
  }, []);

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

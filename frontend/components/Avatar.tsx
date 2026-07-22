import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface AvatarProps {
  /** URL de la foto; si falta se muestran las iniciales. */
  uri: string | null;
  /** Nombre completo del que se derivan las iniciales. */
  nombre?: string;
  size?: number;
}

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

/** Foto de perfil circular con iniciales como alternativa. */
export function Avatar({ uri, nombre = '', size = 64 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const texto = iniciales(nombre);

  return (
    <View style={[styles.contenedor, dimension]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.imagen}
          accessibilityIgnoresInvertColors
          accessibilityLabel={nombre ? `Foto de ${nombre}` : 'Foto de perfil'}
        />
      ) : (
        <Text style={[styles.iniciales, { fontSize: size * 0.36 }]}>
          {texto || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagen: { width: '100%', height: '100%' },
  iniciales: { color: colors.accent, fontWeight: '800' },
});

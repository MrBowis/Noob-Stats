import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface ImagenSeleccionada {
  uri: string;
  name: string;
  type: string;
}

interface ImagePickerFieldProps {
  label: string;
  /** URL o URI de la imagen actual. */
  value: string | null;
  onSelect: (imagen: ImagenSeleccionada) => void;
  onClear?: () => void;
  loading?: boolean;
  helpText?: string;
  errorText?: string;
}

/** Deduce un nombre de archivo con extensión a partir del asset elegido. */
function nombreDe(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.fileName) return asset.fileName;
  const extension = (asset.mimeType?.split('/')[1] ?? 'jpg').replace(
    'jpeg',
    'jpg',
  );
  return `perfil.${extension}`;
}

/**
 * Selector de imagen de perfil: abre la galería del dispositivo (o el diálogo
 * de archivos en web) y muestra una vista previa circular.
 */
export function ImagePickerField({
  label,
  value,
  onSelect,
  onClear,
  loading = false,
  helpText,
  errorText,
}: ImagePickerFieldProps) {
  const elegir = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return;

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (resultado.canceled || !resultado.assets?.length) return;

    const asset = resultado.assets[0];
    onSelect({
      uri: asset.uri,
      name: nombreDe(asset),
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.overline, styles.label]}>{label}</Text>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            value ? 'Cambiar imagen de perfil' : 'Elegir imagen de perfil'
          }
          onPress={() => void elegir()}
          disabled={loading}
          style={({ pressed }) => [
            styles.preview,
            pressed && !loading ? styles.pressed : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : value ? (
            <Image
              source={{ uri: value }}
              style={styles.imagen}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Ionicons name="camera-outline" size={26} color={colors.accent} />
          )}
        </Pressable>

        <View style={styles.acciones}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void elegir()}
            disabled={loading}
            hitSlop={6}
          >
            <Text style={styles.accion}>
              {value ? 'Cambiar imagen' : 'Elegir imagen'}
            </Text>
          </Pressable>

          {value && onClear ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClear}
              disabled={loading}
              hitSlop={6}
            >
              <Text style={[styles.accion, styles.quitar]}>Quitar</Text>
            </Pressable>
          ) : null}

          {helpText ? (
            <Text style={[typography.body, styles.ayuda]}>{helpText}</Text>
          ) : null}
        </View>
      </View>

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  preview: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  imagen: { width: '100%', height: '100%' },
  acciones: { flex: 1, gap: spacing.xs },
  accion: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  quitar: { color: colors.live },
  ayuda: { fontSize: 12 },
  error: {
    ...typography.body,
    color: colors.live,
    marginTop: spacing.xs,
  },
});

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/Card';
import { CTAButton } from '../../../components/CTAButton';
import { FormScreen } from '../../../components/FormScreen';
import {
  ImagenSeleccionada,
  ImagePickerField,
} from '../../../components/ImagePickerField';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { SelectField } from '../../../components/SelectField';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ApiError, jugadoresApi } from '../../../lib/api';
import {
  OPCIONES_GENERO,
  OPCIONES_PIERNA,
  OPCIONES_POSICION,
} from '../../../lib/jugadores';
import { Genero, PiernaHabil, Posicion } from '../../../lib/types';
import { colors, spacing, typography } from '../../../theme';

/**
 * Punto de entrada del futbolista a su perfil deportivo: si ya existe redirige
 * a su ficha; si no, muestra el formulario de creación. El propietario lo
 * determina el backend a partir del token.
 */
export default function MiPerfilDeportivoScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [comprobando, setComprobando] = useState(true);
  const [genero, setGenero] = useState<Genero | null>(null);
  const [nacionalidad, setNacionalidad] = useState('');
  const [foto, setFoto] = useState<ImagenSeleccionada | null>(null);
  const [piernaHabil, setPiernaHabil] = useState<PiernaHabil | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | undefined>();
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    let activo = true;
    void (async () => {
      try {
        const jugador = await jugadoresApi.getMiJugador(token);
        if (activo) router.replace(`/(app)/jugadores/${jugador.id}`);
      } catch (e) {
        // 404 = todavía no hay perfil: se muestra el formulario de creación.
        if (!(e instanceof ApiError && e.status === 404) && activo) {
          showToast(
            e instanceof Error ? e.message : 'No se pudo cargar tu perfil',
            'error',
          );
        }
        if (activo) setComprobando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [token, router, showToast]);

  const crear = async () => {
    setErrorFoto(undefined);
    setCreando(true);
    try {
      const jugador = await jugadoresApi.createJugador(token, {
        genero: genero ?? undefined,
        nacionalidad: nacionalidad.trim() || undefined,
        piernaHabil: piernaHabil ?? undefined,
      });
      // La foto necesita el jugadorId, así que se sube después de crear.
      if (foto) {
        await jugadoresApi
          .uploadFoto(token, jugador.id, foto)
          .catch(() =>
            showToast('El perfil se creó, pero la foto no se pudo subir', 'error'),
          );
      }
      // La primera posición se marca automáticamente como principal.
      if (posicion) {
        await jugadoresApi.addPosicion(token, jugador.id, {
          posicion,
          esPrincipal: true,
        });
      }
      showToast('Perfil deportivo creado', 'success');
      router.replace(`/(app)/jugadores/${jugador.id}`);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo crear el perfil',
        'error',
      );
    } finally {
      setCreando(false);
    }
  };

  if (comprobando) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ActivityIndicator
          color={colors.accent}
          size="large"
          style={styles.loader}
        />
      </SafeAreaView>
    );
  }

  return (
    <FormScreen>
      <ScreenHeader
        title="Crear perfil deportivo"
        subtitle="Tus datos deportivos son públicos para el resto de la app."
        onBack={() => router.back()}
      />

      <Card style={styles.card}>
        <Text style={typography.body}>
          Tu nombre y fecha de nacimiento se toman de tu cuenta; aquí sólo
          registras tu información deportiva.
        </Text>

        <SelectField
          label="Género"
          options={OPCIONES_GENERO}
          value={genero}
          onChange={setGenero}
          placeholder="Sin especificar"
          clearable
        />
        <TextField
          label="Nacionalidad"
          placeholder="Ecuatoriana"
          value={nacionalidad}
          onChangeText={setNacionalidad}
          maxLength={50}
        />
        <ImagePickerField
          label="Foto de perfil"
          value={foto?.uri ?? null}
          onSelect={setFoto}
          onClear={() => setFoto(null)}
          helpText="JPG, PNG, WEBP o GIF. Máximo 5 MB."
          errorText={errorFoto}
        />
        <SelectField
          label="Pierna hábil"
          options={OPCIONES_PIERNA}
          value={piernaHabil}
          onChange={setPiernaHabil}
          placeholder="Sin especificar"
          clearable
        />
        <SelectField
          label="Posición principal"
          options={OPCIONES_POSICION}
          value={posicion}
          onChange={setPosicion}
          placeholder="Sin especificar"
          clearable
        />

        <CTAButton label="Crear perfil" onPress={crear} loading={creando} />
      </Card>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxl },
  card: { gap: spacing.sm },
});

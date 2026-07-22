import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { CTAButton } from '../../../components/CTAButton';
import {
  ImagenSeleccionada,
  ImagePickerField,
} from '../../../components/ImagePickerField';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { jugadoresApi } from '../../../lib/api';
import { Jugador } from '../../../lib/types';
import { colors, spacing, typography } from '../../../theme';

export default function PerfilScreen() {
  const router = useRouter();
  const { session, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  // La foto vive en el perfil deportivo (jugadores-ms), que sólo tienen los
  // futbolistas; para el resto de roles la sección no se muestra.
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | undefined>();
  const esFutbolista = profile?.rol.nombreRol === 'Futbolista';

  useFocusEffect(
    useCallback(() => {
      if (!esFutbolista || !token) return;
      let activo = true;
      jugadoresApi
        .getMiJugador(token)
        .then((j) => {
          if (activo) setJugador(j);
        })
        // 404 = todavía no ha creado su perfil deportivo.
        .catch(() => {
          if (activo) setJugador(null);
        });
      return () => {
        activo = false;
      };
    }, [esFutbolista, token]),
  );

  const cambiarFoto = async (imagen: ImagenSeleccionada) => {
    if (!jugador) return;
    setErrorFoto(undefined);
    setSubiendo(true);
    try {
      const actualizado = await jugadoresApi.uploadFoto(
        token,
        jugador.id,
        imagen,
      );
      setJugador(actualizado);
      showToast('Foto de perfil actualizada', 'success');
    } catch (e) {
      setErrorFoto(
        e instanceof Error ? e.message : 'No se pudo subir la imagen',
      );
    } finally {
      setSubiendo(false);
    }
  };

  const nombreCompleto =
    `${profile?.persona.nombres ?? ''} ${profile?.persona.apellidos ?? ''}`.trim();

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Mi perfil"
          onBack={() => router.back()}
          actionIcon="create-outline"
          onAction={() => router.push('/(app)/perfil/editar')}
          actionLabel="Editar información"
        />

        <Card style={styles.card}>
          <View style={styles.identidad}>
            <Avatar
              uri={jugador?.fotoUrl ?? null}
              nombre={nombreCompleto}
              size={72}
            />
            <View style={styles.identidadInfo}>
              <Text style={styles.nombre}>{nombreCompleto || '—'}</Text>
              <Text style={typography.body}>
                {profile?.rol.nombreRol ?? '—'}
              </Text>
            </View>
          </View>

          <Field label="Correo" value={profile?.usuario.email ?? '—'} />
          <Field
            label="Fecha de nacimiento"
            value={profile?.persona.fechaNacimiento ?? '—'}
          />
          <Field label="Estado" value={profile?.usuario.estado ?? '—'} />
        </Card>

        {esFutbolista ? (
          <Card style={styles.cardFoto}>
            {jugador ? (
              <ImagePickerField
                label="Foto de perfil"
                value={jugador.fotoUrl}
                onSelect={(imagen) => void cambiarFoto(imagen)}
                loading={subiendo}
                helpText="JPG, PNG, WEBP o GIF. Máximo 5 MB."
                errorText={errorFoto}
              />
            ) : (
              <>
                <Text style={typography.body}>
                  Crea tu perfil deportivo para añadir una foto.
                </Text>
                <CTAButton
                  label="Crear perfil deportivo"
                  variant="outline"
                  onPress={() => router.push('/(app)/jugadores/mi-perfil')}
                />
              </>
            )}
          </Card>
        ) : null}

        <CTAButton
          label="Editar información"
          icon={
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.accentText}
            />
          }
          onPress={() => router.push('/(app)/perfil/editar')}
          style={styles.cta}
        />
        <CTAButton
          label="Cerrar sesión"
          variant="outline"
          icon={
            <Ionicons name="log-out-outline" size={18} color={colors.live} />
          }
          onPress={onSignOut}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={typography.overline}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  card: { gap: spacing.lg },
  cardFoto: { marginTop: spacing.lg, gap: spacing.sm },
  identidad: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identidadInfo: { flex: 1, gap: spacing.xs },
  nombre: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  field: { gap: spacing.xs },
  value: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  cta: { marginTop: spacing.md },
});

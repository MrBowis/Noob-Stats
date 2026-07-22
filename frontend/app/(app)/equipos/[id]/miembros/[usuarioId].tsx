import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CTAButton } from '../../../../../components/CTAButton';
import { ScreenHeader } from '../../../../../components/ScreenHeader';
import { SelectPills } from '../../../../../components/SelectPills';
import { TextField } from '../../../../../components/TextField';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import { equiposApi, jugadoresApi } from '../../../../../lib/api';
import { colors, spacing, typography } from '../../../../../theme';

const ESTADOS = [
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
] as const;

type EstadoMiembro = (typeof ESTADOS)[number]['value'];

function parseDorsal(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 && n <= 999 ? n : null;
}

export default function EditarMiembroScreen() {
  const router = useRouter();
  const { id, usuarioId } = useLocalSearchParams<{
    id: string;
    usuarioId: string;
  }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [nombre, setNombre] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [posicion, setPosicion] = useState('');
  const [estado, setEstado] = useState<EstadoMiembro>('activo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const miembros = await equiposApi.listMiembros(token, id);
          const m = miembros.find((x) => x.usuarioId === usuarioId);
          if (!active) return;
          if (!m) {
            showToast('Jugador no encontrado', 'error');
            router.back();
            return;
          }
          setNombre(`${m.nombres} ${m.apellidos}`);
          setDorsal(m.dorsal !== null ? String(m.dorsal) : '');
          setPosicion(m.posicion ?? '');
          setEstado(m.estado === 'inactivo' ? 'inactivo' : 'activo');
        } catch (e) {
          showToast(
            e instanceof Error ? e.message : 'No se pudo cargar el jugador',
            'error',
          );
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [token, id, usuarioId, showToast, router]),
  );

  const onSubmit = async () => {
    if (dorsal.trim() && parseDorsal(dorsal) === null) {
      showToast('El dorsal debe ser un número entre 0 y 999', 'error');
      return;
    }
    setSaving(true);
    try {
      await equiposApi.updateMiembro(token, id, usuarioId, {
        dorsal: parseDorsal(dorsal),
        posicion: posicion.trim() || null,
        estado,
      });
      showToast('Jugador actualizado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar el jugador',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * jugadores-ms indexa los perfiles por `jugadorId`, así que se resuelve
   * buscando en el directorio el perfil cuyo `userId` es el de este miembro.
   */
  const verPerfilDeportivo = async () => {
    try {
      const jugadores = await jugadoresApi.listJugadores(token);
      const jugador = jugadores.find((j) => j.userId === usuarioId);
      if (!jugador) {
        showToast('Este jugador aún no ha creado su perfil deportivo', 'info');
        return;
      }
      router.push(`/(app)/jugadores/${jugador.id}`);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo abrir el perfil deportivo',
        'error',
      );
    }
  };

  const confirmRemove = () => {
    Alert.alert('Quitar jugador', `¿Quitar a ${nombre} del equipo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => void remove(),
      },
    ]);
  };

  const remove = async () => {
    try {
      await equiposApi.removeMiembro(token, id, usuarioId);
      showToast('Jugador quitado del equipo', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo quitar al jugador',
        'error',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Editar jugador" onBack={() => router.back()} />

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <View>
              <Text style={[typography.body, styles.nombre]}>{nombre}</Text>
              <TextField
                label="Dorsal"
                placeholder="10"
                keyboardType="number-pad"
                value={dorsal}
                onChangeText={setDorsal}
              />
              <TextField
                label="Posición"
                placeholder="Delantero"
                value={posicion}
                onChangeText={setPosicion}
              />
              <SelectPills
                label="Estado"
                options={ESTADOS}
                value={estado}
                onChange={setEstado}
              />
              <CTAButton
                label="Guardar cambios"
                onPress={onSubmit}
                loading={saving}
                style={styles.cta}
              />
              <CTAButton
                label="Ver perfil deportivo"
                variant="outline"
                icon={
                  <Ionicons
                    name="football-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                }
                onPress={() => void verPerfilDeportivo()}
                style={styles.cta}
              />
              <CTAButton
                label="Quitar del equipo"
                variant="outline"
                icon={
                  <Ionicons
                    name="person-remove-outline"
                    size={18}
                    color={colors.live}
                  />
                }
                onPress={confirmRemove}
                style={styles.cta}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl },
  loader: { marginTop: spacing.xxl },
  nombre: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  cta: { marginTop: spacing.md },
});

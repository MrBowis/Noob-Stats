import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { CTAButton } from '../../../../components/CTAButton';
import { DateField } from '../../../../components/DateField';
import { EmptyState } from '../../../../components/EmptyState';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { SelectField } from '../../../../components/SelectField';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { jugadoresApi } from '../../../../lib/api';
import {
  labelEstadoLesion,
  labelParteCuerpo,
  OPCIONES_ESTADO_LESION,
  OPCIONES_PARTE_CUERPO,
  tonoEstadoLesion,
} from '../../../../lib/jugadores';
import {
  EstadoLesion,
  JugadorLesion,
  ParteCuerpo,
} from '../../../../lib/types';
import { colors, spacing, typography } from '../../../../theme';

/**
 * Historial de lesiones del jugador. Es de lectura pública; el formulario de
 * alta y edición sólo se muestra al propietario del perfil.
 */
export default function LesionesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [lesiones, setLesiones] = useState<JugadorLesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [esPropietario, setEsPropietario] = useState(false);
  const [filtro, setFiltro] = useState<EstadoLesion | null>(null);

  // Formulario (alta o edición según `editandoId`).
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [parteCuerpo, setParteCuerpo] = useState<ParteCuerpo | null>(null);
  const [nota, setNota] = useState('');
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoLesion | null>('ACTIVA');
  const [errorNota, setErrorNota] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    void (async () => {
      try {
        const [jugador, historial] = await Promise.all([
          jugadoresApi.getJugador(token, id),
          jugadoresApi.listLesiones(token, id, filtro ?? undefined),
        ]);
        if (!activo) return;
        setEsPropietario(jugador.userId === profile?.usuario.id);
        setLesiones(historial);
      } catch (e) {
        if (activo) {
          showToast(
            e instanceof Error ? e.message : 'No se pudieron cargar las lesiones',
            'error',
          );
        }
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [token, id, filtro, profile?.usuario.id, showToast]);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setParteCuerpo(null);
    setNota('');
    setFechaInicio(null);
    setFechaFin(null);
    setEstado('ACTIVA');
    setErrorNota(undefined);
  };

  const editar = (lesion: JugadorLesion) => {
    setEditandoId(lesion.id);
    setParteCuerpo(lesion.parteCuerpo);
    setNota(lesion.nota);
    setFechaInicio(lesion.fechaInicio);
    setFechaFin(lesion.fechaFin);
    setEstado(lesion.estado);
    setErrorNota(undefined);
  };

  const recargar = async () => {
    const historial = await jugadoresApi.listLesiones(
      token,
      id,
      filtro ?? undefined,
    );
    setLesiones(historial);
  };

  const guardar = async () => {
    if (!parteCuerpo) {
      showToast('Selecciona la parte del cuerpo afectada', 'error');
      return;
    }
    const notaLimpia = nota.trim();
    if (!notaLimpia) {
      setErrorNota('La nota es obligatoria');
      return;
    }
    if (notaLimpia.length > 500) {
      setErrorNota('La nota no puede superar los 500 caracteres');
      return;
    }
    if (!fechaInicio) {
      showToast('Selecciona la fecha de inicio', 'error');
      return;
    }
    if (fechaFin && fechaFin < fechaInicio) {
      showToast(
        'La fecha de fin no puede ser anterior a la de inicio',
        'error',
      );
      return;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await jugadoresApi.updateLesion(token, id, editandoId, {
          parteCuerpo,
          nota: notaLimpia,
          fechaInicio,
          fechaFin: fechaFin ?? undefined,
          estado: estado ?? undefined,
        });
        showToast('Lesión actualizada', 'success');
      } else {
        await jugadoresApi.createLesion(token, id, {
          parteCuerpo,
          nota: notaLimpia,
          fechaInicio,
          fechaFin: fechaFin ?? undefined,
          estado: estado ?? undefined,
        });
        showToast('Lesión registrada', 'success');
      }
      limpiarFormulario();
      await recargar();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo guardar la lesión',
        'error',
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (lesionId: string) => {
    try {
      await jugadoresApi.deleteLesion(token, id, lesionId);
      if (editandoId === lesionId) limpiarFormulario();
      await recargar();
      showToast('Lesión eliminada', 'success');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo eliminar la lesión',
        'error',
      );
    }
  };

  if (loading) {
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="Lesiones"
            subtitle="Parte del cuerpo, estado y una nota breve."
            onBack={() => router.back()}
          />

          <Card style={styles.card}>
            <SelectField
              label="Filtrar por estado"
              options={OPCIONES_ESTADO_LESION}
              value={filtro}
              onChange={(v) => {
                setFiltro(v);
                setLoading(true);
              }}
              placeholder="Todos"
              clearable
            />
          </Card>

          {lesiones.length === 0 ? (
            <EmptyState
              icon="medkit-outline"
              title="Sin lesiones"
              message={
                filtro
                  ? 'Ninguna lesión coincide con el filtro.'
                  : 'No hay lesiones registradas en el historial.'
              }
            />
          ) : (
            <View style={styles.lista}>
              {lesiones.map((lesion) => (
                <Card key={lesion.id} style={styles.item}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitulo}>
                        {labelParteCuerpo(lesion.parteCuerpo)}
                      </Text>
                      <Text style={typography.body}>{lesion.nota}</Text>
                      <Text style={typography.body}>
                        {lesion.fechaInicio}
                        {lesion.fechaFin
                          ? ` → ${lesion.fechaFin}`
                          : ' → en curso'}
                      </Text>
                      <Badge
                        label={labelEstadoLesion(lesion.estado)}
                        tone={tonoEstadoLesion(lesion.estado)}
                      />
                    </View>

                    {esPropietario ? (
                      <View style={styles.acciones}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Editar lesión"
                          onPress={() => editar(lesion)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name="create-outline"
                            size={20}
                            color={colors.accent}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Eliminar lesión"
                          onPress={() => void eliminar(lesion.id)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={colors.live}
                          />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </Card>
              ))}
            </View>
          )}

          {esPropietario ? (
            <Card style={styles.formulario}>
              <Text style={styles.seccion}>
                {editandoId ? 'Editar lesión' : 'Registrar lesión'}
              </Text>

              <SelectField
                label="Parte del cuerpo"
                options={OPCIONES_PARTE_CUERPO}
                value={parteCuerpo}
                onChange={setParteCuerpo}
              />
              <TextField
                label="Nota"
                placeholder="Esguince de tobillo"
                value={nota}
                onChangeText={(t) => {
                  setNota(t);
                  setErrorNota(undefined);
                }}
                maxLength={500}
                multiline
                errorText={errorNota}
              />
              <DateField
                label="Fecha de inicio"
                value={fechaInicio}
                onChange={setFechaInicio}
              />
              <DateField
                label="Fecha de recuperación"
                value={fechaFin}
                onChange={setFechaFin}
                placeholder="Sin fecha (en curso)"
              />
              <SelectField
                label="Estado"
                options={OPCIONES_ESTADO_LESION}
                value={estado}
                onChange={setEstado}
              />

              <CTAButton
                label={editandoId ? 'Guardar cambios' : 'Registrar lesión'}
                onPress={guardar}
                loading={guardando}
              />
              {editandoId ? (
                <CTAButton
                  label="Cancelar edición"
                  variant="outline"
                  onPress={limpiarFormulario}
                  style={styles.cta}
                />
              ) : null}
            </Card>
          ) : null}
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
  card: { marginBottom: spacing.lg },
  lista: { gap: spacing.md },
  item: {},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemInfo: { flex: 1, gap: spacing.xs },
  itemTitulo: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  acciones: { flexDirection: 'row', gap: spacing.lg },
  formulario: { marginTop: spacing.xl, gap: spacing.sm },
  seccion: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  cta: { marginTop: spacing.sm },
});

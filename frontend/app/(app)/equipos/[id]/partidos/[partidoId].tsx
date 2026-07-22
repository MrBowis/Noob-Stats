import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '../../../../../components/Badge';
import { Card } from '../../../../../components/Card';
import { CTAButton } from '../../../../../components/CTAButton';
import { DateTimeField } from '../../../../../components/DateTimeField';
import { ScreenHeader } from '../../../../../components/ScreenHeader';
import { SelectPills } from '../../../../../components/SelectPills';
import { TextField } from '../../../../../components/TextField';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import { equiposApi } from '../../../../../lib/api';
import {
  estadoDisciplinario,
  etiquetaDisciplinaria,
  validarNuevaTarjeta,
} from '../../../../../lib/tarjetas';
import {
  MiembroDetalle,
  PartidoDetalle,
  PartidoEstado,
  TarjetaTipo,
  UpdatePartidoPayload,
} from '../../../../../lib/types';
import { colors, radius, spacing, typography } from '../../../../../theme';

const LOCALIA = [
  { label: 'Local', value: 'local' },
  { label: 'Visitante', value: 'visitante' },
] as const;

const ESTADOS = [
  { label: 'Programado', value: 'programado' },
  { label: 'Finalizado', value: 'finalizado' },
  { label: 'Cancelado', value: 'cancelado' },
] as const;

type Localia = (typeof LOCALIA)[number]['value'];
/** Tipo de evento que se está registrando en el modal. */
type EventoTipo = 'gol' | TarjetaTipo;

function parseEntero(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export default function EditarPartidoScreen() {
  const router = useRouter();
  const { id, partidoId } = useLocalSearchParams<{
    id: string;
    partidoId: string;
  }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';
  const usuarioId = profile?.usuario.id;

  const [detalle, setDetalle] = useState<PartidoDetalle | null>(null);
  const [miembros, setMiembros] = useState<MiembroDetalle[]>([]);
  const [esDueno, setEsDueno] = useState(false);

  const [rival, setRival] = useState('');
  const [fecha, setFecha] = useState<string | null>(null);
  const [ubicacion, setUbicacion] = useState('');
  const [localia, setLocalia] = useState<Localia>('local');
  const [estado, setEstado] = useState<PartidoEstado>('programado');
  const [golesFavor, setGolesFavor] = useState('');
  const [golesContra, setGolesContra] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal de registro de eventos
  const [eventoTipo, setEventoTipo] = useState<EventoTipo | null>(null);
  const [minuto, setMinuto] = useState('');

  /** Estado disciplinario de cada jugador en este partido. */
  const disciplina = useMemo(() => {
    const tarjetas = detalle?.tarjetas ?? [];
    const map: Record<string, ReturnType<typeof estadoDisciplinario>> = {};
    for (const m of miembros) {
      map[m.usuarioId] = estadoDisciplinario(tarjetas, m.usuarioId);
    }
    return map;
  }, [detalle?.tarjetas, miembros]);

  const expulsados = useMemo(
    () => miembros.filter((m) => disciplina[m.usuarioId]?.expulsado),
    [miembros, disciplina],
  );

  const load = useCallback(async () => {
    if (!token || !partidoId) return;
    try {
      const p = await equiposApi.getPartido(token, partidoId);
      setDetalle(p);
      setRival(p.rival);
      setFecha(p.fecha);
      setUbicacion(p.ubicacion ?? '');
      setLocalia(p.esLocal ? 'local' : 'visitante');
      setEstado(p.estado);
      setGolesFavor(p.golesFavor !== null ? String(p.golesFavor) : '');
      setGolesContra(p.golesContra !== null ? String(p.golesContra) : '');
      setNotas(p.notas ?? '');

      const [eq, mem] = await Promise.all([
        equiposApi.getEquipo(token, id),
        equiposApi.listMiembros(token, id),
      ]);
      setEsDueno(eq.entrenadorId === usuarioId);
      setMiembros(mem);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo cargar el partido',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [token, partidoId, id, usuarioId, showToast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSubmit = async () => {
    if (!rival.trim()) {
      showToast('Ingresa el rival', 'error');
      return;
    }
    if (!fecha) {
      showToast('Ingresa una fecha y hora válidas', 'error');
      return;
    }
    const payload: UpdatePartidoPayload = {
      rival: rival.trim(),
      fecha,
      ubicacion: ubicacion.trim(),
      esLocal: localia === 'local',
      estado,
      notas: notas.trim(),
    };
    if (estado === 'finalizado') {
      const gf = parseEntero(golesFavor);
      const gc = parseEntero(golesContra);
      if (gf === null || gc === null) {
        showToast('Ingresa el marcador (goles a favor y en contra)', 'error');
        return;
      }
      payload.golesFavor = gf;
      payload.golesContra = gc;
    }

    setSaving(true);
    try {
      await equiposApi.updatePartido(token, partidoId, payload);
      showToast('Partido actualizado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar el partido',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar partido',
      '¿Seguro que deseas eliminar este partido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void remove(),
        },
      ],
    );
  };

  const remove = async () => {
    try {
      await equiposApi.deletePartido(token, partidoId);
      showToast('Partido eliminado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo eliminar el partido',
        'error',
      );
    }
  };

  const registrarEvento = async (jugador: MiembroDetalle) => {
    const tipo = eventoTipo;
    if (!tipo) return;

    // Reglas disciplinarias: dos amarillas equivalen a una roja por
    // acumulación y un jugador expulsado no puede recibir más tarjetas.
    const estadoPrevio = estadoDisciplinario(
      detalle?.tarjetas ?? [],
      jugador.usuarioId,
    );
    if (tipo !== 'gol') {
      const error = validarNuevaTarjeta(estadoPrevio, tipo);
      if (error) {
        showToast(error, 'error');
        return;
      }
    }

    const min = parseEntero(minuto) ?? undefined;
    setEventoTipo(null);
    setMinuto('');
    try {
      if (tipo === 'gol') {
        await equiposApi.addGol(token, partidoId, {
          usuarioId: jugador.usuarioId,
          minuto: min,
        });
        showToast('Gol registrado', 'success');
      } else {
        await equiposApi.addTarjeta(token, partidoId, {
          usuarioId: jugador.usuarioId,
          tipo,
          minuto: min,
        });
        // La segunda amarilla ES la expulsión: no se registra roja adicional.
        if (tipo === 'amarilla' && estadoPrevio.amarillas === 1) {
          showToast(
            'Segunda amarilla: jugador expulsado por acumulación',
            'info',
          );
        } else if (tipo === 'roja') {
          showToast('Roja directa: jugador expulsado', 'info');
        } else {
          showToast('Tarjeta registrada', 'success');
        }
      }
      await load();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo registrar el evento',
        'error',
      );
    }
  };

  const quitarGol = async (golId: string) => {
    try {
      await equiposApi.deleteGol(token, partidoId, golId);
      await load();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo eliminar el gol',
        'error',
      );
    }
  };

  const quitarTarjeta = async (tarjetaId: string) => {
    try {
      await equiposApi.deleteTarjeta(token, partidoId, tarjetaId);
      await load();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo eliminar la tarjeta',
        'error',
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
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
            title={esDueno ? 'Editar partido' : 'Detalle del partido'}
            subtitle={
              esDueno
                ? 'Actualiza los datos, el resultado y los eventos.'
                : undefined
            }
            onBack={() => router.back()}
          />

          {/* ---------------- Eventos del partido ---------------- */}
          <View style={styles.eventosHeader}>
            <Text style={typography.overline}>Goles</Text>
            {esDueno ? (
              <Pressable onPress={() => setEventoTipo('gol')} hitSlop={8}>
                <Text style={styles.addLink}>+ Agregar</Text>
              </Pressable>
            ) : null}
          </View>
          {detalle && detalle.goles.length > 0 ? (
            <View style={styles.list}>
              {detalle.goles.map((g) => (
                <Card key={g.id} style={styles.eventoCard}>
                  <Ionicons name="football" size={18} color={colors.accent} />
                  <Text style={styles.eventoText} numberOfLines={1}>
                    {g.jugadorNombres
                      ? `${g.jugadorNombres} ${g.jugadorApellidos ?? ''}`.trim()
                      : 'Jugador'}
                    {g.minuto !== null ? `  ${g.minuto}'` : ''}
                  </Text>
                  {esDueno ? (
                    <Pressable onPress={() => void quitarGol(g.id)} hitSlop={8}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.live}
                      />
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : (
            <Text style={typography.body}>Sin goles registrados.</Text>
          )}

          <View style={styles.eventosHeader}>
            <Text style={typography.overline}>Tarjetas</Text>
            {esDueno ? (
              <View style={styles.addRow}>
                <Pressable onPress={() => setEventoTipo('amarilla')} hitSlop={8}>
                  <Text style={[styles.addLink, { color: '#F5C518' }]}>
                    + Amarilla
                  </Text>
                </Pressable>
                <Pressable onPress={() => setEventoTipo('roja')} hitSlop={8}>
                  <Text style={[styles.addLink, { color: colors.live }]}>
                    + Roja
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          {detalle && detalle.tarjetas.length > 0 ? (
            <View style={styles.list}>
              {detalle.tarjetas.map((t) => (
                <Card key={t.id} style={styles.eventoCard}>
                  <View
                    style={[
                      styles.cardIcon,
                      {
                        backgroundColor:
                          t.tipo === 'roja' ? colors.live : '#F5C518',
                      },
                    ]}
                  />
                  <Text style={styles.eventoText} numberOfLines={1}>
                    {t.jugadorNombres
                      ? `${t.jugadorNombres} ${t.jugadorApellidos ?? ''}`.trim()
                      : 'Jugador'}
                    {t.minuto !== null ? `  ${t.minuto}'` : ''}
                  </Text>
                  <Badge
                    label={t.tipo}
                    tone={t.tipo === 'roja' ? 'danger' : 'warning'}
                  />
                  {esDueno ? (
                    <Pressable
                      onPress={() => void quitarTarjeta(t.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.live}
                      />
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : (
            <Text style={typography.body}>Sin tarjetas registradas.</Text>
          )}

          {expulsados.length > 0 ? (
            <View style={styles.expulsadosBox}>
              <Text style={typography.overline}>Expulsados</Text>
              {expulsados.map((m) => (
                <Text key={m.id} style={styles.expulsadoText}>
                  {m.nombres} {m.apellidos} —{' '}
                  {disciplina[m.usuarioId]?.motivoExpulsion === 'doble-amarilla'
                    ? 'doble amarilla'
                    : 'roja directa'}
                </Text>
              ))}
            </View>
          ) : null}

          {/* ---------------- Formulario (sólo entrenador) ---------------- */}
          {esDueno ? (
            <View style={styles.form}>
              <Text style={[typography.overline, styles.sectionLabel]}>
                Datos del partido
              </Text>
              <TextField label="Rival" value={rival} onChangeText={setRival} />
              <DateTimeField
                label="Fecha y hora"
                value={fecha}
                onChange={setFecha}
              />
              <TextField
                label="Ubicación"
                value={ubicacion}
                onChangeText={setUbicacion}
              />
              <SelectPills
                label="Localía"
                options={LOCALIA}
                value={localia}
                onChange={setLocalia}
              />
              <SelectPills
                label="Estado"
                options={ESTADOS}
                value={estado}
                onChange={setEstado}
              />

              {estado === 'finalizado' ? (
                <View style={styles.row}>
                  <View style={styles.half}>
                    <TextField
                      label="Goles a favor"
                      placeholder="0"
                      keyboardType="number-pad"
                      value={golesFavor}
                      onChangeText={setGolesFavor}
                    />
                  </View>
                  <View style={styles.half}>
                    <TextField
                      label="Goles en contra"
                      placeholder="0"
                      keyboardType="number-pad"
                      value={golesContra}
                      onChangeText={setGolesContra}
                    />
                  </View>
                </View>
              ) : null}

              <TextField label="Notas" value={notas} onChangeText={setNotas} />

              <CTAButton
                label="Guardar cambios"
                onPress={onSubmit}
                loading={saving}
                style={styles.cta}
              />
              <CTAButton
                label="Eliminar partido"
                variant="outline"
                icon={
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.live}
                  />
                }
                onPress={confirmDelete}
                style={styles.cta}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal: elegir jugador para el evento */}
      <Modal
        visible={!!eventoTipo}
        transparent
        animationType="fade"
        onRequestClose={() => setEventoTipo(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setEventoTipo(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {eventoTipo === 'gol'
                ? 'Registrar gol'
                : `Tarjeta ${eventoTipo ?? ''}`}
            </Text>
            <Pressable onPress={() => setEventoTipo(null)} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <TextField
            label="Minuto (opcional)"
            placeholder="23"
            keyboardType="number-pad"
            value={minuto}
            onChangeText={setMinuto}
          />

          <Text style={[typography.overline, styles.sheetLabel]}>
            Selecciona el jugador
          </Text>
          <ScrollView contentContainerStyle={styles.sheetList}>
            {miembros.map((m) => {
              const estado = disciplina[m.usuarioId];
              const etiqueta = estado ? etiquetaDisciplinaria(estado) : null;
              // Un jugador expulsado no puede recibir más tarjetas.
              const bloqueado =
                eventoTipo !== 'gol' && !!estado?.expulsado;
              return (
                <Pressable
                  key={m.id}
                  disabled={bloqueado}
                  style={[
                    styles.sheetItem,
                    bloqueado ? styles.sheetItemDisabled : null,
                  ]}
                  onPress={() => void registrarEvento(m)}
                >
                  <View style={styles.dorsalSmall}>
                    <Text style={styles.dorsalSmallText}>
                      {m.dorsal ?? '-'}
                    </Text>
                  </View>
                  <View style={styles.sheetItemInfo}>
                    <Text style={styles.sheetItemText} numberOfLines={1}>
                      {m.nombres} {m.apellidos}
                    </Text>
                    {etiqueta ? (
                      <Text style={typography.body} numberOfLines={1}>
                        {etiqueta}
                      </Text>
                    ) : null}
                  </View>
                  {estado?.expulsado ? (
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.live}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  cta: { marginTop: spacing.md },
  form: { marginTop: spacing.xl },
  sectionLabel: { marginBottom: spacing.md },
  eventosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  addRow: { flexDirection: 'row', gap: spacing.lg },
  addLink: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  list: { gap: spacing.sm },
  eventoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  eventoText: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  cardIcon: { width: 12, height: 16, borderRadius: 2 },
  // Modal
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  sheetLabel: { marginBottom: spacing.sm },
  sheetList: { gap: spacing.xs, paddingBottom: spacing.lg },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.input,
  },
  sheetItemDisabled: { opacity: 0.45 },
  sheetItemInfo: { flex: 1, gap: 2 },
  sheetItemText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  expulsadosBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  expulsadoText: { color: colors.live, fontSize: 13, fontWeight: '600' },
  dorsalSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dorsalSmallText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
});

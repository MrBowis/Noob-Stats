import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../../components/Card';
import { EmptyState } from '../../../../components/EmptyState';
import { PitchField } from '../../../../components/PitchField';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { equiposApi } from '../../../../lib/api';
import {
  FORMACIONES,
  FORMACION_DESCRIPCION,
  FormationSlot,
  esFormacion,
  slotsDeFormacion,
} from '../../../../lib/formations';
import { Equipo, MiembroDetalle } from '../../../../lib/types';
import { colors, radius, spacing, typography } from '../../../../theme';

export default function AlineacionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';
  const usuarioId = profile?.usuario.id;

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [miembros, setMiembros] = useState<MiembroDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slotEditando, setSlotEditando] = useState<FormationSlot | null>(null);

  const isOwner = !!equipo && equipo.entrenadorId === usuarioId;

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [eq, mem] = await Promise.all([
        equiposApi.getEquipo(token, id),
        equiposApi.listMiembros(token, id),
      ]);
      setEquipo(eq);
      setMiembros(mem);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo cargar la alineación',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [token, id, showToast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const slots = useMemo(
    () => slotsDeFormacion(equipo?.formacion),
    [equipo?.formacion],
  );

  const asignados = useMemo(() => {
    const map: Record<string, MiembroDetalle | undefined> = {};
    for (const m of miembros) {
      if (m.slot) map[m.slot] = m;
    }
    return map;
  }, [miembros]);

  const suplentes = useMemo(
    () => miembros.filter((m) => !m.slot),
    [miembros],
  );

  const cambiarFormacion = async (formacion: string) => {
    if (!equipo || formacion === equipo.formacion) return;
    setSaving(true);
    try {
      const actualizado = await equiposApi.updateEquipo(token, id, {
        formacion,
      });
      setEquipo(actualizado);
      // Las casillas cambian con la formación: recargamos la plantilla.
      await load();
      showToast(`Formación ${formacion}`, 'success');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo cambiar la formación',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const asignarJugador = async (
    slot: FormationSlot,
    jugador: MiembroDetalle | null,
  ) => {
    setSlotEditando(null);
    setSaving(true);
    try {
      if (jugador) {
        await equiposApi.updateMiembro(token, id, jugador.usuarioId, {
          slot: slot.code,
        });
      } else {
        // Quitar de la cancha al jugador que ocupaba la casilla.
        const actual = asignados[slot.code];
        if (!actual) return;
        await equiposApi.updateMiembro(token, id, actual.usuarioId, {
          slot: null,
        });
      }
      await load();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar la alineación',
        'error',
      );
    } finally {
      setSaving(false);
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
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Alineación"
          subtitle={
            isOwner
              ? 'Toca una posición para asignar un jugador.'
              : 'Alineación titular del equipo.'
          }
          onBack={() => router.back()}
        />

        {/* Selector de formación */}
        <Text style={[typography.overline, styles.sectionLabel]}>Formación</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FORMACIONES.map((f) => {
            const active = equipo?.formacion === f;
            return (
              <Pressable
                key={f}
                disabled={!isOwner || saving}
                onPress={() => void cambiarFormacion(f)}
                style={[
                  styles.chip,
                  active ? styles.chipActive : null,
                  !isOwner ? styles.chipDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.accentText : colors.textPrimary },
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {esFormacion(equipo?.formacion) ? (
          <Text style={[typography.body, styles.formacionDesc]}>
            {FORMACION_DESCRIPCION[equipo.formacion]}
          </Text>
        ) : null}

        {/* Cancha */}
        <PitchField
          slots={slots}
          asignados={asignados}
          onSlotPress={isOwner ? (slot) => setSlotEditando(slot) : undefined}
        />

        {saving ? (
          <ActivityIndicator color={colors.accent} style={styles.savingBar} />
        ) : null}

        {/* Suplentes */}
        <Text style={[typography.overline, styles.sectionLabel]}>
          Suplentes ({suplentes.length})
        </Text>
        {suplentes.length === 0 ? (
          <Text style={typography.body}>Todos los jugadores están alineados.</Text>
        ) : (
          <View style={styles.list}>
            {suplentes.map((m) => (
              <Card key={m.id} style={styles.suplenteCard}>
                <View style={styles.dorsal}>
                  <Text style={styles.dorsalText}>{m.dorsal ?? '-'}</Text>
                </View>
                <View style={styles.suplenteInfo}>
                  <Text style={styles.suplenteName} numberOfLines={1}>
                    {m.nombres} {m.apellidos}
                  </Text>
                  <Text style={typography.body} numberOfLines={1}>
                    {m.posicion ?? 'Sin posición'}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Selector de jugador para la casilla */}
      <Modal
        visible={!!slotEditando}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotEditando(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSlotEditando(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              Posición {slotEditando?.label}
            </Text>
            <Pressable onPress={() => setSlotEditando(null)} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetList}>
            {slotEditando && asignados[slotEditando.code] ? (
              <Pressable
                style={styles.sheetItem}
                onPress={() => void asignarJugador(slotEditando, null)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={colors.live}
                />
                <Text style={[styles.sheetItemText, { color: colors.live }]}>
                  Quitar de la alineación
                </Text>
              </Pressable>
            ) : null}

            {miembros.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="Sin jugadores"
                message="Invita jugadores al equipo para armar la alineación."
              />
            ) : (
              miembros.map((m) => {
                const enEstaCasilla = m.slot === slotEditando?.code;
                return (
                  <Pressable
                    key={m.id}
                    style={styles.sheetItem}
                    onPress={() =>
                      slotEditando && void asignarJugador(slotEditando, m)
                    }
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
                      <Text style={typography.body} numberOfLines={1}>
                        {m.slot
                          ? `En cancha (${m.slot})`
                          : (m.posicion ?? 'Suplente')}
                      </Text>
                    </View>
                    {enEstaCasilla ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.accent}
                      />
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.md },
  chips: { gap: spacing.sm, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipDisabled: { opacity: 0.6 },
  chipText: { fontSize: 14, fontWeight: '700' },
  formacionDesc: { marginBottom: spacing.lg },
  savingBar: { marginTop: spacing.md },
  list: { gap: spacing.sm },
  suplenteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  suplenteInfo: { flex: 1, gap: 2 },
  suplenteName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  dorsal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dorsalText: { color: colors.accent, fontWeight: '800', fontSize: 15 },
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
    maxHeight: '70%',
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
  sheetList: { gap: spacing.xs, paddingBottom: spacing.lg },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.input,
  },
  sheetItemInfo: { flex: 1, gap: 2 },
  sheetItemText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
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

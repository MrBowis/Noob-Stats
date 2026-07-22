import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, BadgeTone } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { CTAButton } from '../../../../components/CTAButton';
import { EmptyState } from '../../../../components/EmptyState';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { StatTile } from '../../../../components/StatTile';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { equiposApi } from '../../../../lib/api';
import { formatFechaHora } from '../../../../lib/format';
import {
  Equipo,
  EstadisticasEquipo,
  MiembroDetalle,
  Partido,
} from '../../../../lib/types';
import { colors, radius, spacing, typography } from '../../../../theme';

function SectionTitle({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={typography.overline}>{label}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PartidoRow({
  partido,
  onPress,
}: {
  partido: Partido;
  onPress?: () => void;
}) {
  const finalizado = partido.estado === 'finalizado';
  let tone: BadgeTone = 'accent';
  let marcador = partido.esLocal ? 'Local' : 'Visitante';
  if (finalizado && partido.golesFavor !== null && partido.golesContra !== null) {
    marcador = `${partido.golesFavor} - ${partido.golesContra}`;
    tone =
      partido.golesFavor > partido.golesContra
        ? 'success'
        : partido.golesFavor === partido.golesContra
          ? 'warning'
          : 'danger';
  }
  return (
    <Card onPress={onPress} style={styles.partidoCard}>
      <View style={styles.partidoInfo}>
        <Text style={styles.partidoRival} numberOfLines={1}>
          {partido.esLocal ? 'vs' : '@'} {partido.rival}
        </Text>
        <Text style={typography.body}>{formatFechaHora(partido.fecha)}</Text>
        {partido.ubicacion ? (
          <Text style={typography.body}>{partido.ubicacion}</Text>
        ) : null}
      </View>
      <Badge label={marcador} tone={tone} />
    </Card>
  );
}

export default function EquipoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';
  const usuarioId = profile?.usuario.id;

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [stats, setStats] = useState<EstadisticasEquipo | null>(null);
  const [proximos, setProximos] = useState<Partido[]>([]);
  const [anteriores, setAnteriores] = useState<Partido[]>([]);
  const [miembros, setMiembros] = useState<MiembroDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmar, setConfirmar] = useState<'eliminar' | 'salir' | null>(
    null,
  );

  const isOwner = !!equipo && equipo.entrenadorId === usuarioId;
  const soyMiembro = miembros.some((m) => m.usuarioId === usuarioId);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token || !id) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const [eq, st, prox, ant, mem] = await Promise.all([
          equiposApi.getEquipo(token, id),
          equiposApi.getEstadisticas(token, id),
          equiposApi.listPartidos(token, id, 'proximos'),
          equiposApi.listPartidos(token, id, 'anteriores'),
          equiposApi.listMiembros(token, id),
        ]);
        setEquipo(eq);
        setStats(st);
        setProximos(prox);
        setAnteriores(ant);
        setMiembros(mem);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudo cargar el equipo',
          'error',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, id, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const deleteEquipo = async () => {
    setConfirmar(null);
    try {
      await equiposApi.deleteEquipo(token, id);
      showToast('Equipo eliminado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo eliminar el equipo',
        'error',
      );
    }
  };

  const leave = async () => {
    setConfirmar(null);
    if (!usuarioId) return;
    try {
      await equiposApi.removeMiembro(token, id, usuarioId);
      showToast('Saliste del equipo', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo salir del equipo',
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

  if (!equipo) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <ScreenHeader title="Equipo" onBack={() => router.back()} />
          <EmptyState
            icon="alert-circle-outline"
            title="Equipo no disponible"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={colors.accent}
          />
        }
      >
        <ScreenHeader
          title={equipo.nombre}
          subtitle={
            [equipo.categoria, equipo.ciudad].filter(Boolean).join(' · ') ||
            undefined
          }
          onBack={() => router.back()}
          actionIcon={isOwner ? 'create-outline' : undefined}
          onAction={
            isOwner
              ? () => router.push(`/(app)/equipos/${id}/editar`)
              : undefined
          }
          actionLabel="Editar equipo"
        />

        {equipo.descripcion ? (
          <Text style={[typography.body, styles.descripcion]}>
            {equipo.descripcion}
          </Text>
        ) : null}

        {/* Acciones */}
        <View style={styles.actionsRow}>
          <ActionButton
            icon="football-outline"
            label={`Alineación ${equipo.formacion}`}
            onPress={() => router.push(`/(app)/equipos/${id}/alineacion`)}
          />
          {isOwner ? (
            <>
              <ActionButton
                icon="person-add-outline"
                label="Invitar"
                onPress={() => router.push(`/(app)/equipos/${id}/invitar`)}
              />
              <ActionButton
                icon="mail-outline"
                label="Invitaciones"
                onPress={() =>
                  router.push(`/(app)/equipos/${id}/invitaciones`)
                }
              />
              <ActionButton
                icon="calendar-outline"
                label="Programar"
                onPress={() =>
                  router.push(`/(app)/equipos/${id}/partidos/nuevo`)
                }
              />
            </>
          ) : null}
        </View>

        {/* Estadísticas */}
        {stats ? (
          <View style={styles.section}>
            <SectionTitle label="Estadísticas" />
            <View style={styles.statsGrid}>
              <StatTile value={stats.puntos} label="Puntos" />
              <StatTile value={stats.partidosJugados} label="Jugados" />
              <StatTile
                value={stats.victorias}
                label="Victorias"
                valueColor={colors.success}
              />
              <StatTile value={stats.empates} label="Empates" />
              <StatTile
                value={stats.derrotas}
                label="Derrotas"
                valueColor={colors.live}
              />
              <StatTile value={stats.totalMiembros} label="Jugadores" />
              <StatTile value={stats.golesFavor} label="G. favor" />
              <StatTile value={stats.golesContra} label="G. contra" />
              <StatTile value={stats.diferenciaGoles} label="Dif." />
            </View>
          </View>
        ) : null}

        {/* Próximos partidos */}
        <View style={styles.section}>
          <SectionTitle label="Próximos partidos" />
          {proximos.length === 0 ? (
            <Text style={typography.body}>No hay partidos programados.</Text>
          ) : (
            <View style={styles.list}>
              {proximos.map((p) => (
                <PartidoRow
                  key={p.id}
                  partido={p}
                  onPress={() =>
                    router.push(`/(app)/equipos/${id}/partidos/${p.id}`)
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Resultados */}
        <View style={styles.section}>
          <SectionTitle label="Resultados" />
          {anteriores.length === 0 ? (
            <Text style={typography.body}>Aún no hay resultados.</Text>
          ) : (
            <View style={styles.list}>
              {anteriores.map((p) => (
                <PartidoRow
                  key={p.id}
                  partido={p}
                  onPress={() =>
                    router.push(`/(app)/equipos/${id}/partidos/${p.id}`)
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Plantilla */}
        <View style={styles.section}>
          <SectionTitle label={`Plantilla (${miembros.length})`} />
          {miembros.length === 0 ? (
            <Text style={typography.body}>El equipo no tiene jugadores.</Text>
          ) : (
            <View style={styles.list}>
              {miembros.map((m) => (
                <Card
                  key={m.id}
                  onPress={
                    isOwner
                      ? () =>
                          router.push(
                            `/(app)/equipos/${id}/miembros/${m.usuarioId}`,
                          )
                      : undefined
                  }
                  style={styles.miembroCard}
                >
                  <View style={styles.dorsal}>
                    <Text style={styles.dorsalText}>
                      {m.dorsal ?? '-'}
                    </Text>
                  </View>
                  <View style={styles.miembroInfo}>
                    <Text style={styles.miembroName} numberOfLines={1}>
                      {m.nombres} {m.apellidos}
                    </Text>
                    <Text style={typography.body} numberOfLines={1}>
                      {m.posicion ?? 'Sin posición'}
                    </Text>
                  </View>
                  {m.estado !== 'activo' ? (
                    <Badge label={m.estado} tone="neutral" />
                  ) : null}
                  {isOwner ? (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textSecondary}
                    />
                  ) : null}
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Acciones destructivas */}
        {isOwner ? (
          <CTAButton
            label="Eliminar equipo"
            variant="outline"
            icon={
              <Ionicons name="trash-outline" size={18} color={colors.live} />
            }
            onPress={() => setConfirmar('eliminar')}
            style={styles.dangerBtn}
          />
        ) : soyMiembro ? (
          <CTAButton
            label="Salir del equipo"
            variant="outline"
            icon={
              <Ionicons name="exit-outline" size={18} color={colors.live} />
            }
            onPress={() => setConfirmar('salir')}
            style={styles.dangerBtn}
          />
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmar !== null}
        title={confirmar === 'salir' ? 'Salir del equipo' : 'Eliminar equipo'}
        message={
          confirmar === 'salir'
            ? '¿Seguro que deseas salir del equipo?'
            : '¿Seguro que deseas eliminar este equipo? También se eliminarán sus miembros, invitaciones y partidos.'
        }
        confirmLabel={confirmar === 'salir' ? 'Salir' : 'Eliminar'}
        destructive
        onConfirm={() =>
          void (confirmar === 'salir' ? leave() : deleteEquipo())
        }
        onCancel={() => setConfirmar(null)}
      />
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.accent} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  descripcion: { marginTop: -spacing.sm, marginBottom: spacing.lg },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  action: {
    flexGrow: 1,
    flexBasis: '28%',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionPressed: { opacity: 0.8 },
  actionLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: { gap: spacing.md },
  partidoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  partidoInfo: { flex: 1, gap: spacing.xs },
  partidoRival: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  miembroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dorsal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dorsalText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
  },
  miembroInfo: { flex: 1, gap: spacing.xs },
  miembroName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerBtn: { marginTop: spacing.sm },
});

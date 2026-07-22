import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { CTAButton } from '../../components/CTAButton';
import { DrawerMenu } from '../../components/DrawerMenu';
import { EmptyState } from '../../components/EmptyState';
import { StatTile } from '../../components/StatTile';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminApi, equiposApi } from '../../lib/api';
import { formatFechaHora } from '../../lib/format';
import {
  Equipo,
  EstadisticasAdmin,
  EstadisticasEquipo,
  Partido,
} from '../../lib/types';
import { colors, radius, spacing, typography } from '../../theme';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = profile?.rol.nombreRol === 'Administrador';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú"
          onPress={() => setDrawerOpen(true)}
          hitSlop={8}
          style={styles.menuBtn}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={typography.overline}>Noob Stats</Text>
          <Text style={styles.greeting} numberOfLines={1}>
            Hola, {profile?.persona.nombres ?? 'jugador'}
          </Text>
        </View>
      </View>

      {isAdmin ? <AdminDashboard /> : <TeamDashboard />}

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

/* ----------------------------- Admin ----------------------------- */

function AdminDashboard() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [stats, setStats] = useState<EstadisticasAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        setStats(await adminApi.getEstadisticas(token));
      } catch (e) {
        showToast(
          e instanceof Error
            ? e.message
            : 'No se pudieron cargar las estadísticas',
          'error',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  if (loading) {
    return <ActivityIndicator color={colors.accent} style={styles.loader} />;
  }

  return (
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
      <Text style={[typography.overline, styles.sectionLabel]}>Resumen</Text>
      <View style={styles.statsGrid}>
        <StatTile value={stats?.usuarios.total ?? 0} label="Usuarios" />
        <StatTile
          value={stats?.usuarios.activos ?? 0}
          label="Activos"
          valueColor={colors.success}
        />
        <StatTile
          value={stats?.usuarios.inactivos ?? 0}
          label="Inactivos"
          valueColor={colors.live}
        />
        <StatTile value={stats?.equipos.total ?? 0} label="Equipos" />
      </View>

      <Text style={[typography.overline, styles.sectionLabel]}>
        Tabla de posiciones
      </Text>
      {stats && stats.tablaPosiciones.length > 0 ? (
        <StandingsTable filas={stats.tablaPosiciones} />
      ) : (
        <EmptyState
          icon="podium-outline"
          title="Sin datos"
          message="Aún no hay partidos finalizados para calcular posiciones."
        />
      )}
    </ScrollView>
  );
}

const COLS: { key: string; label: string; width: number }[] = [
  { key: 'pos', label: '#', width: 28 },
  { key: 'nombre', label: 'Equipo', width: 140 },
  { key: 'pj', label: 'PJ', width: 34 },
  { key: 'v', label: 'V', width: 30 },
  { key: 'e', label: 'E', width: 30 },
  { key: 'd', label: 'D', width: 30 },
  { key: 'dg', label: 'DG', width: 40 },
  { key: 'pts', label: 'Pts', width: 40 },
];

// Alto fijo de cada fila para acotar el scroll a los 10 primeros equipos.
const STANDINGS_ROW_HEIGHT = 40;
const STANDINGS_VISIBLE_ROWS = 10;

function StandingsTable({
  filas,
}: {
  filas: EstadisticasAdmin['tablaPosiciones'];
}) {
  const scrollable = filas.length > STANDINGS_VISIBLE_ROWS;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.tableRow, styles.tableHead]}>
          {COLS.map((c) => (
            <Text
              key={c.key}
              style={[
                styles.th,
                { width: c.width },
                c.key === 'nombre' ? styles.thLeft : null,
              ]}
            >
              {c.label}
            </Text>
          ))}
        </View>
        <ScrollView
          style={
            scrollable
              ? { maxHeight: STANDINGS_ROW_HEIGHT * STANDINGS_VISIBLE_ROWS }
              : undefined
          }
          nestedScrollEnabled
          showsVerticalScrollIndicator={scrollable}
        >
          {filas.map((fila, i) => (
            <View key={fila.equipoId} style={styles.tableRow}>
              <Text style={[styles.td, { width: COLS[0].width }]}>{i + 1}</Text>
              <Text
                style={[styles.td, styles.tdLeft, { width: COLS[1].width }]}
                numberOfLines={1}
              >
                {fila.nombre}
              </Text>
              <Text style={[styles.td, { width: COLS[2].width }]}>
                {fila.partidosJugados}
              </Text>
              <Text style={[styles.td, { width: COLS[3].width }]}>
                {fila.victorias}
              </Text>
              <Text style={[styles.td, { width: COLS[4].width }]}>
                {fila.empates}
              </Text>
              <Text style={[styles.td, { width: COLS[5].width }]}>
                {fila.derrotas}
              </Text>
              <Text style={[styles.td, { width: COLS[6].width }]}>
                {fila.diferenciaGoles}
              </Text>
              <Text style={[styles.td, styles.tdPts, { width: COLS[7].width }]}>
                {fila.puntos}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

/* -------------------------- Usuario normal -------------------------- */

function TeamDashboard() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';
  const usuarioId = profile?.usuario.id;

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<EstadisticasEquipo | null>(null);
  const [proximo, setProximo] = useState<Partido | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const loadEquipos = useCallback(async () => {
    if (!token) return;
    try {
      const data = await equiposApi.listEquipos(token);
      setEquipos(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudieron cargar los equipos',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useFocusEffect(
    useCallback(() => {
      void loadEquipos();
    }, [loadEquipos]),
  );

  useEffect(() => {
    if (!token || !selectedId) return;
    let active = true;
    void (async () => {
      setLoadingTeam(true);
      try {
        const [st, prox] = await Promise.all([
          equiposApi.getEstadisticas(token, selectedId),
          equiposApi.listPartidos(token, selectedId, 'proximos'),
        ]);
        if (!active) return;
        setStats(st);
        setProximo(prox[0] ?? null);
      } catch {
        if (active) {
          setStats(null);
          setProximo(null);
        }
      } finally {
        if (active) setLoadingTeam(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token, selectedId]);

  if (loading) {
    return <ActivityIndicator color={colors.accent} style={styles.loader} />;
  }

  if (equipos.length === 0) {
    return (
      <View style={styles.content}>
        <EmptyState
          icon="shield-outline"
          title="Sin equipos"
          message="Aún no perteneces a ningún equipo. Abre el menú para explorar."
        />
      </View>
    );
  }

  const selected = equipos.find((e) => e.id === selectedId);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Selector de equipo */}
      {equipos.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {equipos.map((eq) => {
            const active = eq.id === selectedId;
            return (
              <Pressable
                key={eq.id}
                onPress={() => setSelectedId(eq.id)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.accentText : colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {eq.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {selected ? (
        <>
          <View style={styles.teamHeader}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{selected.nombre}</Text>
              <Text style={typography.body}>
                {[selected.categoria, selected.ciudad]
                  .filter(Boolean)
                  .join(' · ') || 'Sin categoría'}
              </Text>
            </View>
            <Badge
              label={
                selected.entrenadorId === usuarioId ? 'Entrenador' : 'Jugador'
              }
              tone={selected.entrenadorId === usuarioId ? 'accent' : 'neutral'}
            />
          </View>

          {loadingTeam ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <>
              {stats ? (
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
                </View>
              ) : null}

              <Text style={[typography.overline, styles.sectionLabel]}>
                Próximo partido
              </Text>
              {proximo ? (
                <Card style={styles.partidoCard}>
                  <View style={styles.partidoInfo}>
                    <Text style={styles.partidoRival} numberOfLines={1}>
                      {proximo.esLocal ? 'vs' : '@'} {proximo.rival}
                    </Text>
                    <Text style={typography.body}>
                      {formatFechaHora(proximo.fecha)}
                    </Text>
                    {proximo.ubicacion ? (
                      <Text style={typography.body}>{proximo.ubicacion}</Text>
                    ) : null}
                  </View>
                  <Badge
                    label={proximo.esLocal ? 'Local' : 'Visitante'}
                    tone="accent"
                  />
                </Card>
              ) : (
                <Text style={typography.body}>
                  No hay partidos programados.
                </Text>
              )}

              <CTAButton
                label="Ver detalle del equipo"
                onPress={() => router.push(`/(app)/equipos/${selected.id}`)}
                style={styles.cta}
              />
            </>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  greeting: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // Tabla de posiciones
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STANDINGS_ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHead: { borderBottomColor: colors.accent },
  th: {
    ...typography.overline,
    textAlign: 'center',
  },
  thLeft: { textAlign: 'left' },
  td: {
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  tdLeft: { textAlign: 'left', fontWeight: '700' },
  tdPts: { fontWeight: '800', color: colors.accent },
  // Selector de equipo
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
  chipText: { fontSize: 14, fontWeight: '700', maxWidth: 180 },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  teamInfo: { flex: 1, gap: spacing.xs },
  teamName: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  partidoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  partidoInfo: { flex: 1, gap: spacing.xs },
  partidoRival: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  cta: { marginTop: spacing.xl },
});

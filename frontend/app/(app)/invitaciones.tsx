import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, BadgeTone } from '../../components/Badge';
import { Card } from '../../components/Card';
import { CTAButton } from '../../components/CTAButton';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SelectPills } from '../../components/SelectPills';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { equiposApi } from '../../lib/api';
import { formatFecha } from '../../lib/format';
import { InvitacionDetalle, InvitacionEstado } from '../../lib/types';
import { colors, spacing, typography } from '../../theme';

function estadoTone(estado: InvitacionEstado): BadgeTone {
  switch (estado) {
    case 'pendiente':
      return 'warning';
    case 'aceptada':
      return 'success';
    case 'rechazada':
      return 'danger';
    default:
      return 'neutral';
  }
}

const FILTROS = [
  { label: 'Pendientes', value: 'pendientes' },
  { label: 'Todas', value: 'todas' },
] as const;

type Filtro = (typeof FILTROS)[number]['value'];

export default function MisInvitacionesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [invitaciones, setInvitaciones] = useState<InvitacionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const data = await equiposApi.listMisInvitaciones(
          token,
          filtro === 'pendientes',
        );
        setInvitaciones(data);
      } catch (e) {
        showToast(
          e instanceof Error
            ? e.message
            : 'No se pudieron cargar las invitaciones',
          'error',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, filtro, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const responder = async (invitacionId: string, aceptar: boolean) => {
    setRespondingId(invitacionId);
    try {
      await equiposApi.responderInvitacion(token, invitacionId, aceptar);
      showToast(
        aceptar ? 'Te uniste al equipo' : 'Invitación rechazada',
        aceptar ? 'success' : 'info',
      );
      void load('refresh');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo responder',
        'error',
      );
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <ScreenHeader
          title="Mis invitaciones"
          subtitle="Invitaciones que has recibido de equipos."
          onBack={() => router.back()}
        />

        <SelectPills
          options={FILTROS}
          value={filtro}
          onChange={setFiltro}
        />

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={invitaciones}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load('refresh')}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="mail-open-outline"
                title="Sin invitaciones"
                message={
                  filtro === 'pendientes'
                    ? 'No tienes invitaciones pendientes.'
                    : 'No has recibido invitaciones.'
                }
              />
            }
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.equipoNombre}</Text>
                    {item.mensaje ? (
                      <Text style={typography.body}>{item.mensaje}</Text>
                    ) : null}
                    <Text style={styles.meta}>
                      Recibida el {formatFecha(item.createdAt)}
                    </Text>
                  </View>
                  <Badge label={item.estado} tone={estadoTone(item.estado)} />
                </View>
                {item.estado === 'pendiente' ? (
                  <View style={styles.actions}>
                    <CTAButton
                      label="Aceptar"
                      onPress={() => void responder(item.id, true)}
                      loading={respondingId === item.id}
                      style={styles.actionBtn}
                    />
                    <CTAButton
                      label="Rechazar"
                      variant="outline"
                      onPress={() => void responder(item.id, false)}
                      disabled={respondingId === item.id}
                      style={styles.actionBtn}
                    />
                  </View>
                ) : null}
              </Card>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  loader: { marginTop: spacing.xxl },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: { gap: spacing.md },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: { flex: 1, gap: spacing.xs },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1 },
});

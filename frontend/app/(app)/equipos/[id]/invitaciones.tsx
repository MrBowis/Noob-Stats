import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, BadgeTone } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { EmptyState } from '../../../../components/EmptyState';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { equiposApi } from '../../../../lib/api';
import { formatFecha } from '../../../../lib/format';
import { InvitacionDetalle, InvitacionEstado } from '../../../../lib/types';
import { colors, spacing, typography } from '../../../../theme';

function estadoInvitacionTone(estado: InvitacionEstado): BadgeTone {
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

export default function InvitacionesEquipoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [invitaciones, setInvitaciones] = useState<InvitacionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token || !id) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const data = await equiposApi.listInvitacionesEquipo(token, id);
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
    [token, id, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const confirmCancel = (inv: InvitacionDetalle) => {
    Alert.alert('Cancelar invitación', `¿Cancelar la invitación a ${inv.jugadorNombres}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar invitación',
        style: 'destructive',
        onPress: () => void cancel(inv.id),
      },
    ]);
  };

  const cancel = async (invitacionId: string) => {
    try {
      await equiposApi.cancelarInvitacion(token, invitacionId);
      showToast('Invitación cancelada', 'success');
      void load('refresh');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo cancelar',
        'error',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <ScreenHeader
          title="Invitaciones"
          subtitle="Invitaciones enviadas por este equipo."
          onBack={() => router.back()}
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
                icon="mail-outline"
                title="Sin invitaciones"
                message="Aún no has invitado a ningún jugador."
              />
            }
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.info}>
                    <Text style={styles.name}>
                      {item.jugadorNombres} {item.jugadorApellidos}
                    </Text>
                    <Text style={typography.body}>{item.jugadorEmail}</Text>
                    <Text style={styles.meta}>
                      Enviada el {formatFecha(item.createdAt)}
                    </Text>
                  </View>
                  <Badge
                    label={item.estado}
                    tone={estadoInvitacionTone(item.estado)}
                  />
                </View>
                {item.estado === 'pendiente' ? (
                  <Pressable
                    onPress={() => confirmCancel(item)}
                    style={styles.cancelBtn}
                    hitSlop={6}
                  >
                    <Text style={styles.cancelText}>Cancelar invitación</Text>
                  </Pressable>
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
  cancelBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  cancelText: {
    color: colors.live,
    fontWeight: '700',
    fontSize: 14,
  },
});

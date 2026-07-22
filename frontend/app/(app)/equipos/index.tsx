import { Ionicons } from '@expo/vector-icons';
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
import { Badge } from '../../../components/Badge';
import { Card } from '../../../components/Card';
import { CTAButton } from '../../../components/CTAButton';
import { EmptyState } from '../../../components/EmptyState';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { equiposApi } from '../../../lib/api';
import { Equipo } from '../../../lib/types';
import { colors, spacing, typography } from '../../../theme';

export default function EquiposScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';
  const isEntrenador = profile?.rol.nombreRol === 'Entrenador';
  const usuarioId = profile?.usuario.id;

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const data = await equiposApi.listEquipos(token);
        setEquipos(data);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudieron cargar los equipos',
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <ScreenHeader
          title="Mis equipos"
          subtitle={
            isEntrenador
              ? 'Gestiona tus equipos y su plantilla.'
              : 'Equipos a los que perteneces.'
          }
          onBack={() => router.back()}
        />

        {isEntrenador ? (
          <CTAButton
            label="Crear equipo"
            icon={
              <Ionicons name="add" size={20} color={colors.accentText} />
            }
            onPress={() => router.push('/(app)/equipos/crear')}
            style={styles.createBtn}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={equipos}
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
                icon="shield-outline"
                title="Sin equipos todavía"
                message={
                  isEntrenador
                    ? 'Crea tu primer equipo para empezar a gestionarlo.'
                    : 'Cuando aceptes una invitación aparecerá aquí tu equipo.'
                }
              />
            }
            renderItem={({ item }) => (
              <Card
                onPress={() => router.push(`/(app)/equipos/${item.id}`)}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={typography.body}>
                      {[item.categoria, item.ciudad]
                        .filter(Boolean)
                        .join(' · ') || 'Sin categoría'}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <Badge
                  label={
                    item.entrenadorId === usuarioId ? 'Entrenador' : 'Jugador'
                  }
                  tone={
                    item.entrenadorId === usuarioId ? 'accent' : 'neutral'
                  }
                />
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
  createBtn: { marginBottom: spacing.lg },
  loader: { marginTop: spacing.xxl },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: { gap: spacing.md },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: { flex: 1, gap: spacing.xs },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});

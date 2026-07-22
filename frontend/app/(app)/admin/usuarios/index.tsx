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
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { CTAButton } from '../../../../components/CTAButton';
import { EmptyState } from '../../../../components/EmptyState';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { SelectPills } from '../../../../components/SelectPills';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { adminApi } from '../../../../lib/api';
import { UsuarioDetalle } from '../../../../lib/types';
import { colors, spacing, typography } from '../../../../theme';

const FILTROS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activo' },
  { label: 'Inactivos', value: 'inactivo' },
] as const;

type Filtro = (typeof FILTROS)[number]['value'];

export default function UsuariosScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [usuarios, setUsuarios] = useState<UsuarioDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const estado = filtro === 'todos' ? undefined : filtro;
        setUsuarios(await adminApi.listUsuarios(token, estado));
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudieron cargar los usuarios',
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <ScreenHeader
          title="Usuarios"
          subtitle="Gestiona los usuarios de la plataforma."
          onBack={() => router.back()}
        />

        <CTAButton
          label="Crear usuario"
          icon={<Ionicons name="add" size={20} color={colors.accentText} />}
          onPress={() => router.push('/(app)/admin/usuarios/nuevo')}
          style={styles.createBtn}
        />

        <SelectPills options={FILTROS} value={filtro} onChange={setFiltro} />

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={usuarios}
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
                icon="people-outline"
                title="Sin usuarios"
                message="No hay usuarios para el filtro seleccionado."
              />
            }
            renderItem={({ item }) => (
              <Card
                onPress={() => router.push(`/(app)/admin/usuarios/${item.id}`)}
                style={styles.card}
              >
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.persona.nombres} {item.persona.apellidos}
                  </Text>
                  <Text style={typography.body} numberOfLines={1}>
                    {item.email}
                  </Text>
                  <View style={styles.badges}>
                    <Badge label={item.rol.nombreRol} tone="accent" />
                    <Badge
                      label={item.estado}
                      tone={item.estado === 'activo' ? 'success' : 'danger'}
                    />
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
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
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: spacing.xs },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});

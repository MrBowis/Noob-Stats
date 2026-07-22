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
import { Card } from '../../../../components/Card';
import { CTAButton } from '../../../../components/CTAButton';
import { EmptyState } from '../../../../components/EmptyState';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { adminApi } from '../../../../lib/api';
import { Rol } from '../../../../lib/types';
import { colors, spacing, typography } from '../../../../theme';

export default function RolesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        setRoles(await adminApi.listRoles(token));
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudieron cargar los roles',
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
          title="Roles"
          subtitle="Administra los roles del sistema."
          onBack={() => router.back()}
        />

        <CTAButton
          label="Crear rol"
          icon={<Ionicons name="add" size={20} color={colors.accentText} />}
          onPress={() => router.push('/(app)/admin/roles/nuevo')}
          style={styles.createBtn}
        />

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={roles}
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
                icon="ribbon-outline"
                title="Sin roles"
                message="Crea el primer rol del sistema."
              />
            }
            renderItem={({ item }) => (
              <Card
                onPress={() => router.push(`/(app)/admin/roles/${item.id}`)}
                style={styles.card}
              >
                <View style={styles.info}>
                  <Text style={styles.name}>{item.nombreRol}</Text>
                  <Text style={typography.body} numberOfLines={2}>
                    {item.descripcion ?? 'Sin descripción'}
                  </Text>
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
});

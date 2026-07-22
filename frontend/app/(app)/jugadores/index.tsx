import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Card } from '../../../components/Card';
import { CTAButton } from '../../../components/CTAButton';
import { EmptyState } from '../../../components/EmptyState';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { SelectField } from '../../../components/SelectField';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { jugadoresApi } from '../../../lib/api';
import {
  labelEstadoJugador,
  labelPierna,
  labelPosicion,
  OPCIONES_ESTADO_JUGADOR,
  OPCIONES_PIERNA,
  OPCIONES_POSICION,
  tonoEstadoJugador,
} from '../../../lib/jugadores';
import {
  EstadoJugador,
  PiernaHabil,
  Posicion,
  ResumenJugador,
} from '../../../lib/types';
import { colors, spacing, typography } from '../../../theme';

/**
 * Directorio público de futbolistas. Cualquier usuario autenticado puede
 * consultarlo; los entrenadores lo usan para explorar perfiles antes de
 * invitar jugadores a su equipo.
 */
export default function JugadoresScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [jugadores, setJugadores] = useState<ResumenJugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [piernaHabil, setPiernaHabil] = useState<PiernaHabil | null>(null);
  const [estado, setEstado] = useState<EstadoJugador | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      void (async () => {
        try {
          const lista = await jugadoresApi.listJugadores(token, {
            posicion: posicion ?? undefined,
            piernaHabil: piernaHabil ?? undefined,
            estado: estado ?? undefined,
          });
          // El listado no incluye la identidad (vive en auth-ms): se pide el
          // resumen de cada perfil para mostrar nombre y posición.
          const resumenes = await Promise.all(
            lista.map((j) => jugadoresApi.getResumen(token, j.id)),
          );
          if (activo) setJugadores(resumenes);
        } catch (e) {
          if (activo) {
            showToast(
              e instanceof Error
                ? e.message
                : 'No se pudieron cargar los jugadores',
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
    }, [token, posicion, piernaHabil, estado, showToast]),
  );

  const hayFiltros = !!(posicion || piernaHabil || estado);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Jugadores"
          subtitle="Explora los perfiles deportivos registrados."
          onBack={() => router.back()}
        />

        <Card style={styles.filtros}>
          <SelectField
            label="Posición"
            options={OPCIONES_POSICION}
            value={posicion}
            onChange={setPosicion}
            placeholder="Todas"
            clearable
          />
          <SelectField
            label="Pierna hábil"
            options={OPCIONES_PIERNA}
            value={piernaHabil}
            onChange={setPiernaHabil}
            placeholder="Todas"
            clearable
          />
          <SelectField
            label="Estado"
            options={OPCIONES_ESTADO_JUGADOR}
            value={estado}
            onChange={setEstado}
            placeholder="Todos"
            clearable
          />
          {hayFiltros ? (
            <CTAButton
              label="Limpiar filtros"
              variant="outline"
              onPress={() => {
                setPosicion(null);
                setPiernaHabil(null);
                setEstado(null);
              }}
            />
          ) : null}
        </Card>

        {loading ? (
          <ActivityIndicator
            color={colors.accent}
            size="large"
            style={styles.loader}
          />
        ) : jugadores.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Sin jugadores"
            message={
              hayFiltros
                ? 'Ningún jugador coincide con los filtros seleccionados.'
                : 'Todavía no hay perfiles deportivos registrados.'
            }
          />
        ) : (
          <View style={styles.lista}>
            {jugadores.map((jugador) => (
              <Card
                key={jugador.jugadorId}
                onPress={() =>
                  router.push(`/(app)/jugadores/${jugador.jugadorId}`)
                }
              >
                <View style={styles.itemRow}>
                  <Avatar
                    uri={jugador.fotoUrl}
                    nombre={`${jugador.nombres} ${jugador.apellidos}`}
                    size={48}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitulo}>
                      {`${jugador.nombres} ${jugador.apellidos}`.trim()}
                    </Text>
                    <Text style={typography.body}>
                      {jugador.posicionPrincipal
                        ? labelPosicion(jugador.posicionPrincipal)
                        : 'Sin posición'}
                      {' · '}
                      {labelPierna(jugador.piernaHabil)}
                      {jugador.nacionalidad ? ` · ${jugador.nacionalidad}` : ''}
                    </Text>
                    <Badge
                      label={labelEstadoJugador(jugador.estado)}
                      tone={tonoEstadoJugador(jugador.estado)}
                    />
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  filtros: { marginBottom: spacing.lg },
  loader: { marginTop: spacing.xxl },
  lista: { gap: spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemInfo: { gap: spacing.xs, flex: 1 },
  itemTitulo: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
});

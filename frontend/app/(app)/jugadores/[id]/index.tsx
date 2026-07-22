import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../../components/Avatar';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { CTAButton } from '../../../../components/CTAButton';
import { EmptyState } from '../../../../components/EmptyState';
import { PentagonChart } from '../../../../components/PentagonChart';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { StatTile } from '../../../../components/StatTile';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { jugadoresApi } from '../../../../lib/api';
import {
  labelEstadoJugador,
  labelEstadoLesion,
  labelParteCuerpo,
  labelPierna,
  labelPosicion,
  tonoEstadoJugador,
  tonoEstadoLesion,
} from '../../../../lib/jugadores';
import {
  Equipo,
  JugadorLesion,
  ResumenJugador,
} from '../../../../lib/types';
import { colors, spacing, typography } from '../../../../theme';

/**
 * Ficha pública del futbolista: resumen, pentágono de atributos, historial de
 * lesiones y equipos. El propietario ve además los accesos de edición.
 */
export default function JugadorDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [resumen, setResumen] = useState<ResumenJugador | null>(null);
  const [lesiones, setLesiones] = useState<JugadorLesion[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  const usuarioId = profile?.usuario.id;
  const esPropietario = !!resumen && resumen.userId === usuarioId;

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      void (async () => {
        try {
          const [datos, historial] = await Promise.all([
            jugadoresApi.getResumen(token, id),
            jugadoresApi.listLesiones(token, id),
          ]);
          if (!activo) return;
          setResumen(datos);
          setLesiones(historial);

          // Sólo el propietario puede resolver sus equipos en equipos-ms.
          if (datos.userId === usuarioId) {
            const misEquipos = await jugadoresApi
              .listEquipos(token, id)
              .catch(() => []);
            if (activo) setEquipos(misEquipos);
          } else if (activo) {
            setEquipos([]);
          }
        } catch (e) {
          if (activo) {
            showToast(
              e instanceof Error ? e.message : 'No se pudo cargar el jugador',
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
    }, [token, id, usuarioId, showToast]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ActivityIndicator
          color={colors.accent}
          size="large"
          style={styles.loader}
        />
      </SafeAreaView>
    );
  }

  if (!resumen) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader title="Jugador" onBack={() => router.back()} />
          <EmptyState
            icon="alert-circle-outline"
            title="Perfil no disponible"
            message="No se pudo cargar la información de este jugador."
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const nombre = `${resumen.nombres} ${resumen.apellidos}`.trim();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={nombre || 'Jugador'}
          subtitle={
            resumen.posicionPrincipal
              ? labelPosicion(resumen.posicionPrincipal)
              : 'Sin posición principal'
          }
          onBack={() => router.back()}
          actionIcon={esPropietario ? 'create-outline' : undefined}
          onAction={
            esPropietario
              ? () => router.push(`/(app)/jugadores/${id}/editar`)
              : undefined
          }
          actionLabel="Editar perfil deportivo"
        />

        {/* Identidad y estado */}
        <Card style={styles.card}>
          <View style={styles.identidad}>
            <Avatar uri={resumen.fotoUrl} nombre={nombre} size={72} />
            <View style={styles.identidadInfo}>
              <Text style={styles.nombre}>{nombre}</Text>
              <View style={styles.cabecera}>
                <Badge
                  label={labelEstadoJugador(resumen.estado)}
                  tone={tonoEstadoJugador(resumen.estado)}
                />
                {resumen.posicionesSecundarias.map((p) => (
                  <Badge key={p} label={labelPosicion(p)} tone="accent" />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.tiles}>
            <StatTile
              value={resumen.alturaCm ? `${resumen.alturaCm}` : '—'}
              label="Altura (cm)"
            />
            <StatTile
              value={resumen.pesoKg ? `${resumen.pesoKg}` : '—'}
              label="Peso (kg)"
            />
            <StatTile
              value={labelPierna(resumen.piernaHabil)}
              label="Pierna hábil"
            />
          </View>

          <Dato label="Nacionalidad" value={resumen.nacionalidad ?? '—'} />
          <Dato
            label="Fecha de nacimiento"
            value={resumen.fechaNacimiento ?? '—'}
          />
        </Card>

        {/* Pentágono de atributos */}
        <Card style={styles.card}>
          <Text style={styles.seccion}>Atributos</Text>
          <Text style={typography.body}>
            Valoración del perfil (0-100). No son estadísticas de partidos.
          </Text>
          <PentagonChart atributos={resumen.atributos} />
        </Card>

        {/* Lesiones */}
        <Card style={styles.card}>
          <View style={styles.seccionRow}>
            <Text style={styles.seccion}>Lesiones</Text>
            {esPropietario ? (
              <Ionicons
                name="medkit-outline"
                size={18}
                color={colors.accent}
                onPress={() => router.push(`/(app)/jugadores/${id}/lesiones`)}
              />
            ) : null}
          </View>

          {lesiones.length === 0 ? (
            <Text style={typography.body}>Sin lesiones registradas.</Text>
          ) : (
            <View style={styles.lista}>
              {lesiones.slice(0, 3).map((lesion) => (
                <View key={lesion.id} style={styles.lesion}>
                  <View style={styles.lesionInfo}>
                    <Text style={styles.lesionTitulo}>
                      {labelParteCuerpo(lesion.parteCuerpo)}
                    </Text>
                    <Text style={typography.body} numberOfLines={1}>
                      {lesion.nota}
                    </Text>
                    <Text style={typography.body}>
                      {lesion.fechaInicio}
                      {lesion.fechaFin ? ` → ${lesion.fechaFin}` : ''}
                    </Text>
                  </View>
                  <Badge
                    label={labelEstadoLesion(lesion.estado)}
                    tone={tonoEstadoLesion(lesion.estado)}
                  />
                </View>
              ))}
            </View>
          )}

          {esPropietario ? (
            <CTAButton
              label="Gestionar lesiones"
              variant="outline"
              onPress={() => router.push(`/(app)/jugadores/${id}/lesiones`)}
              style={styles.cta}
            />
          ) : null}
        </Card>

        {/* Equipos (servidos por equipos-ms) */}
        {esPropietario ? (
          <Card style={styles.card}>
            <Text style={styles.seccion}>Mis equipos</Text>
            {equipos.length === 0 ? (
              <Text style={typography.body}>
                Todavía no perteneces a ningún equipo.
              </Text>
            ) : (
              <View style={styles.lista}>
                {equipos.map((equipo) => (
                  <Card
                    key={equipo.id}
                    onPress={() => router.push(`/(app)/equipos/${equipo.id}`)}
                    style={styles.equipo}
                  >
                    <Text style={styles.lesionTitulo}>{equipo.nombre}</Text>
                    <Text style={typography.body}>
                      {equipo.ciudad ?? 'Sin ciudad'}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </Card>
        ) : null}

        {esPropietario ? (
          <CTAButton
            label="Editar perfil deportivo"
            onPress={() => router.push(`/(app)/jugadores/${id}/editar`)}
            style={styles.cta}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dato}>
      <Text style={typography.overline}>{label}</Text>
      <Text style={styles.datoValor}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  loader: { marginTop: spacing.xxl },
  card: { marginBottom: spacing.lg, gap: spacing.md },
  identidad: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identidadInfo: { flex: 1, gap: spacing.sm },
  nombre: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  cabecera: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  seccion: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  seccionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dato: { gap: spacing.xs },
  datoValor: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  lista: { gap: spacing.md },
  lesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lesionInfo: { flex: 1, gap: 2 },
  lesionTitulo: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  equipo: { backgroundColor: colors.background, gap: spacing.xs },
  cta: { marginTop: spacing.sm },
});

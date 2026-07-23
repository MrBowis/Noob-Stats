import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttributeSlider } from '../../../../components/AttributeSlider';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { CTAButton } from '../../../../components/CTAButton';
import { EmptyState } from '../../../../components/EmptyState';
import { FormScreen } from '../../../../components/FormScreen';
import {
  ImagenSeleccionada,
  ImagePickerField,
} from '../../../../components/ImagePickerField';
import { PentagonChart } from '../../../../components/PentagonChart';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { SelectField } from '../../../../components/SelectField';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { jugadoresApi } from '../../../../lib/api';
import {
  labelPosicion,
  OPCIONES_ESTADO_JUGADOR,
  OPCIONES_GENERO,
  OPCIONES_PIERNA,
  OPCIONES_POSICION,
  parseMedida,
  soloNumeroDecimal,
} from '../../../../lib/jugadores';
import {
  Atributos,
  EstadoJugador,
  Genero,
  JugadorPosicion,
  PiernaHabil,
  Posicion,
} from '../../../../lib/types';
import { colors, spacing, typography } from '../../../../theme';

const ATRIBUTOS_INICIALES: Atributos = {
  ataque: 50,
  tactica: 50,
  tecnica: 50,
  defensa: 50,
  creatividad: 50,
};

/**
 * Edición del perfil deportivo propio, en secciones independientes que se
 * guardan por separado (cada una consume su propia ruta del microservicio).
 */
export default function EditarJugadorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);

  // Perfil
  const [genero, setGenero] = useState<Genero | null>(null);
  const [nacionalidad, setNacionalidad] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [piernaHabil, setPiernaHabil] = useState<PiernaHabil | null>(null);
  const [estado, setEstado] = useState<EstadoJugador | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | undefined>();
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Físico
  const [alturaCm, setAlturaCm] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [errorAltura, setErrorAltura] = useState<string | undefined>();
  const [errorPeso, setErrorPeso] = useState<string | undefined>();
  const [guardandoFisico, setGuardandoFisico] = useState(false);

  // Posiciones
  const [posiciones, setPosiciones] = useState<JugadorPosicion[]>([]);
  const [nuevaPosicion, setNuevaPosicion] = useState<Posicion | null>(null);
  const [guardandoPosicion, setGuardandoPosicion] = useState(false);

  // Atributos
  const [atributos, setAtributos] = useState<Atributos>(ATRIBUTOS_INICIALES);
  const [guardandoAtributos, setGuardandoAtributos] = useState(false);

  useEffect(() => {
    let activo = true;
    void (async () => {
      try {
        const jugador = await jugadoresApi.getJugador(token, id);
        if (!activo) return;

        if (jugador.userId !== profile?.usuario.id) {
          setPermitido(false);
          setLoading(false);
          return;
        }
        setPermitido(true);
        setGenero(jugador.genero);
        setNacionalidad(jugador.nacionalidad ?? '');
        setFotoUrl(jugador.fotoUrl);
        setPiernaHabil(jugador.piernaHabil);
        setEstado(jugador.estado);

        const [fisico, listaPosiciones, valores] = await Promise.all([
          jugadoresApi.getFisico(token, id),
          jugadoresApi.listPosiciones(token, id),
          jugadoresApi.getAtributos(token, id),
        ]);
        if (!activo) return;
        setAlturaCm(fisico?.alturaCm != null ? String(fisico.alturaCm) : '');
        setPesoKg(fisico?.pesoKg != null ? String(fisico.pesoKg) : '');
        setPosiciones(listaPosiciones);
        if (valores) {
          setAtributos({
            ataque: valores.ataque,
            tactica: valores.tactica,
            tecnica: valores.tecnica,
            defensa: valores.defensa,
            creatividad: valores.creatividad,
          });
        }
      } catch (e) {
        if (activo) {
          showToast(
            e instanceof Error ? e.message : 'No se pudo cargar el perfil',
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
  }, [token, id, profile?.usuario.id, showToast]);

  const fallo = (e: unknown, fallback: string) =>
    showToast(e instanceof Error ? e.message : fallback, 'error');

  /** La foto se sube al momento: el backend guarda la URL en el perfil. */
  const subirFoto = async (imagen: ImagenSeleccionada) => {
    setErrorFoto(undefined);
    setSubiendoFoto(true);
    try {
      const jugador = await jugadoresApi.uploadFoto(token, id, imagen);
      setFotoUrl(jugador.fotoUrl);
      showToast('Foto de perfil actualizada', 'success');
    } catch (e) {
      setErrorFoto(
        e instanceof Error ? e.message : 'No se pudo subir la imagen',
      );
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfil = async () => {
    if (nacionalidad.trim().length > 50) {
      showToast('La nacionalidad no puede superar los 50 caracteres', 'error');
      return;
    }

    setGuardandoPerfil(true);
    try {
      await jugadoresApi.updateJugador(token, id, {
        genero: genero ?? undefined,
        nacionalidad: nacionalidad.trim() || undefined,
        piernaHabil: piernaHabil ?? undefined,
        estado: estado ?? undefined,
      });
      showToast('Perfil actualizado', 'success');
    } catch (e) {
      fallo(e, 'No se pudo actualizar el perfil');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const guardarFisico = async () => {
    const altura = parseMedida(alturaCm, 'La altura', 300);
    const peso = parseMedida(pesoKg, 'El peso', 300);
    setErrorAltura('error' in altura ? altura.error : undefined);
    setErrorPeso('error' in peso ? peso.error : undefined);
    if ('error' in altura || 'error' in peso) return;

    setGuardandoFisico(true);
    try {
      await jugadoresApi.updateFisico(token, id, {
        alturaCm: altura.valor ?? undefined,
        pesoKg: peso.valor ?? undefined,
      });
      showToast('Datos físicos actualizados', 'success');
    } catch (e) {
      fallo(e, 'No se pudieron actualizar los datos físicos');
    } finally {
      setGuardandoFisico(false);
    }
  };

  const agregarPosicion = async () => {
    if (!nuevaPosicion) {
      showToast('Selecciona una posición', 'error');
      return;
    }
    setGuardandoPosicion(true);
    try {
      const creada = await jugadoresApi.addPosicion(token, id, {
        posicion: nuevaPosicion,
        esPrincipal: posiciones.length === 0,
      });
      setPosiciones((prev) => [...prev, creada]);
      setNuevaPosicion(null);
      showToast('Posición añadida', 'success');
    } catch (e) {
      fallo(e, 'No se pudo añadir la posición');
    } finally {
      setGuardandoPosicion(false);
    }
  };

  const marcarPrincipal = async (posicionId: string) => {
    try {
      await jugadoresApi.updatePosicion(token, id, posicionId, {
        esPrincipal: true,
      });
      // Sólo puede haber una principal: el resto pasa a secundaria.
      setPosiciones((prev) =>
        prev.map((p) => ({ ...p, esPrincipal: p.id === posicionId })),
      );
    } catch (e) {
      fallo(e, 'No se pudo marcar la posición principal');
    }
  };

  const eliminarPosicion = async (posicionId: string) => {
    try {
      await jugadoresApi.deletePosicion(token, id, posicionId);
      setPosiciones((prev) => prev.filter((p) => p.id !== posicionId));
    } catch (e) {
      fallo(e, 'No se pudo eliminar la posición');
    }
  };

  const guardarAtributos = async () => {
    setGuardandoAtributos(true);
    try {
      await jugadoresApi.updateAtributos(token, id, atributos);
      showToast('Atributos actualizados', 'success');
    } catch (e) {
      fallo(e, 'No se pudieron actualizar los atributos');
    } finally {
      setGuardandoAtributos(false);
    }
  };

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

  if (!permitido) {
    return (
      <FormScreen>
        <ScreenHeader title="Editar perfil" onBack={() => router.back()} />
        <EmptyState
          icon="lock-closed-outline"
          title="Sin permisos"
          message="Solo el propietario puede editar este perfil deportivo."
        />
      </FormScreen>
    );
  }

  const disponibles = OPCIONES_POSICION.filter(
    (o) => !posiciones.some((p) => p.posicion === o.value),
  );

  return (
    <FormScreen>
          <ScreenHeader
            title="Editar perfil"
            subtitle="Cada sección se guarda por separado."
            onBack={() => router.back()}
          />

          {/* ---- Perfil ---- */}
          <Card style={styles.card}>
            <Text style={styles.seccion}>Información deportiva</Text>
            <SelectField
              label="Género"
              options={OPCIONES_GENERO}
              value={genero}
              onChange={setGenero}
              placeholder="Sin especificar"
              clearable
            />
            <TextField
              label="Nacionalidad"
              placeholder="Ecuatoriana"
              value={nacionalidad}
              onChangeText={setNacionalidad}
              maxLength={50}
            />
            <ImagePickerField
              label="Foto de perfil"
              value={fotoUrl}
              onSelect={(imagen) => void subirFoto(imagen)}
              loading={subiendoFoto}
              helpText="JPG, PNG, WEBP o GIF. Máximo 5 MB."
              errorText={errorFoto}
            />
            <SelectField
              label="Pierna hábil"
              options={OPCIONES_PIERNA}
              value={piernaHabil}
              onChange={setPiernaHabil}
              placeholder="Sin especificar"
              clearable
            />
            <SelectField
              label="Estado"
              options={OPCIONES_ESTADO_JUGADOR}
              value={estado}
              onChange={setEstado}
              placeholder="Activo"
            />
            <CTAButton
              label="Guardar información"
              onPress={guardarPerfil}
              loading={guardandoPerfil}
            />
          </Card>

          {/* ---- Datos físicos ---- */}
          <Card style={styles.card}>
            <Text style={styles.seccion}>Datos físicos</Text>
            <TextField
              label="Altura (cm)"
              placeholder="178.5"
              keyboardType="decimal-pad"
              value={alturaCm}
              onChangeText={(t) => {
                setAlturaCm(soloNumeroDecimal(t));
                setErrorAltura(undefined);
              }}
              errorText={errorAltura}
            />
            <TextField
              label="Peso (kg)"
              placeholder="72"
              keyboardType="decimal-pad"
              value={pesoKg}
              onChangeText={(t) => {
                setPesoKg(soloNumeroDecimal(t));
                setErrorPeso(undefined);
              }}
              errorText={errorPeso}
            />
            <CTAButton
              label="Guardar datos físicos"
              onPress={guardarFisico}
              loading={guardandoFisico}
            />
          </Card>

          {/* ---- Posiciones ---- */}
          <Card style={styles.card}>
            <Text style={styles.seccion}>Posiciones</Text>
            <Text style={typography.body}>
              Puedes tener una posición principal y varias secundarias.
            </Text>

            {posiciones.length === 0 ? (
              <Text style={typography.body}>Sin posiciones registradas.</Text>
            ) : (
              <View style={styles.lista}>
                {posiciones.map((p) => (
                  <View key={p.id} style={styles.posicion}>
                    <View style={styles.posicionInfo}>
                      <Text style={styles.posicionTexto}>
                        {labelPosicion(p.posicion)}
                      </Text>
                      {p.esPrincipal ? (
                        <Badge label="Principal" tone="accent" />
                      ) : null}
                    </View>
                    <View style={styles.acciones}>
                      {!p.esPrincipal ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Marcar ${labelPosicion(p.posicion)} como principal`}
                          onPress={() => void marcarPrincipal(p.id)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name="star-outline"
                            size={20}
                            color={colors.accent}
                          />
                        </Pressable>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar ${labelPosicion(p.posicion)}`}
                        onPress={() => void eliminarPosicion(p.id)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.live}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {disponibles.length > 0 ? (
              <>
                <SelectField
                  label="Añadir posición"
                  options={disponibles}
                  value={nuevaPosicion}
                  onChange={setNuevaPosicion}
                  placeholder="Selecciona una posición"
                />
                <CTAButton
                  label="Añadir posición"
                  variant="outline"
                  onPress={agregarPosicion}
                  loading={guardandoPosicion}
                />
              </>
            ) : null}
          </Card>

          {/* ---- Atributos ---- */}
          <Card style={styles.card}>
            <Text style={styles.seccion}>Atributos</Text>
            <Text style={typography.body}>
              Valoración del perfil de 0 a 100. No son estadísticas de partidos.
            </Text>
            <PentagonChart atributos={atributos} size={200} />

            <AttributeSlider
              label="Ataque"
              value={atributos.ataque}
              onChange={(v) => setAtributos((a) => ({ ...a, ataque: v }))}
            />
            <AttributeSlider
              label="Táctica"
              value={atributos.tactica}
              onChange={(v) => setAtributos((a) => ({ ...a, tactica: v }))}
            />
            <AttributeSlider
              label="Técnica"
              value={atributos.tecnica}
              onChange={(v) => setAtributos((a) => ({ ...a, tecnica: v }))}
            />
            <AttributeSlider
              label="Defensa"
              value={atributos.defensa}
              onChange={(v) => setAtributos((a) => ({ ...a, defensa: v }))}
            />
            <AttributeSlider
              label="Creatividad"
              value={atributos.creatividad}
              onChange={(v) => setAtributos((a) => ({ ...a, creatividad: v }))}
            />

            <CTAButton
              label="Guardar atributos"
              onPress={guardarAtributos}
              loading={guardandoAtributos}
            />
          </Card>

          <CTAButton
            label="Gestionar lesiones"
            variant="outline"
            onPress={() => router.push(`/(app)/jugadores/${id}/lesiones`)}
          />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxl },
  card: { marginBottom: spacing.lg, gap: spacing.sm },
  seccion: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  lista: { gap: spacing.md, marginVertical: spacing.sm },
  posicion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posicionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  posicionTexto: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  acciones: { flexDirection: 'row', gap: spacing.lg },
});

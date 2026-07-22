import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormationSlot } from '../lib/formations';
import { MiembroDetalle } from '../lib/types';
import { colors, radius, spacing } from '../theme';

/** Relación de aspecto de la cancha (alto / ancho). */
const PITCH_RATIO = 1.45;
const TOKEN = 42;

interface PitchFieldProps {
  slots: FormationSlot[];
  /** Jugadores asignados, indexados por código de casilla. */
  asignados: Record<string, MiembroDetalle | undefined>;
  /** Si se define, cada casilla es pulsable (modo edición del entrenador). */
  onSlotPress?: (slot: FormationSlot) => void;
  /** Casilla resaltada (p. ej. la que se está editando). */
  selectedSlot?: string | null;
}

/**
 * Cancha de fútbol con la alineación del equipo. Dibuja las líneas del campo y
 * coloca a cada jugador en la coordenada de su casilla dentro de la formación.
 */
export function PitchField({
  slots,
  asignados,
  onSlotPress,
  selectedSlot,
}: PitchFieldProps) {
  return (
    <View style={styles.pitch}>
      {/* Líneas del campo */}
      <View style={styles.halfLine} />
      <View style={styles.centerCircle} />
      <View style={styles.centerSpot} />
      <View style={[styles.area, styles.areaBottom]} />
      <View style={[styles.areaSmall, styles.areaSmallBottom]} />
      <View style={[styles.area, styles.areaTop]} />
      <View style={[styles.areaSmall, styles.areaSmallTop]} />

      {/* Jugadores */}
      {slots.map((slot) => {
        const jugador = asignados[slot.code];
        const selected = selectedSlot === slot.code;
        // y=0 es la portería propia (abajo) → se invierte para el layout.
        const top = `${(1 - slot.y) * 100}%` as const;
        const left = `${slot.x * 100}%` as const;

        const content = (
          <View style={styles.tokenWrap}>
            <View
              style={[
                styles.token,
                jugador ? styles.tokenFilled : styles.tokenEmpty,
                selected ? styles.tokenSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.tokenText,
                  jugador ? styles.tokenTextFilled : null,
                ]}
                numberOfLines={1}
              >
                {jugador ? (jugador.dorsal ?? '-') : slot.label}
              </Text>
            </View>
            <Text style={styles.tokenName} numberOfLines={1}>
              {jugador ? jugador.apellidos || jugador.nombres : slot.label}
            </Text>
          </View>
        );

        return (
          <View
            key={slot.code}
            style={[styles.slot, { top, left }]}
            pointerEvents="box-none"
          >
            {onSlotPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Casilla ${slot.label}`}
                onPress={() => onSlotPress(slot)}
                style={({ pressed }) => (pressed ? styles.pressed : null)}
              >
                {content}
              </Pressable>
            ) : (
              content
            )}
          </View>
        );
      })}
    </View>
  );
}

const LINE = 'rgba(255,255,255,0.28)';

const styles = StyleSheet.create({
  pitch: {
    width: '100%',
    aspectRatio: 1 / PITCH_RATIO,
    backgroundColor: '#12351F',
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: LINE,
    overflow: 'hidden',
  },
  halfLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: LINE,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 90,
    height: 90,
    marginLeft: -45,
    marginTop: -45,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: LINE,
  },
  centerSpot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    marginLeft: -3,
    marginTop: -3,
    borderRadius: 3,
    backgroundColor: LINE,
  },
  area: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    height: '16%',
    borderWidth: 2,
    borderColor: LINE,
  },
  areaBottom: { bottom: -2 },
  areaTop: { top: -2 },
  areaSmall: {
    position: 'absolute',
    left: '33%',
    right: '33%',
    height: '7%',
    borderWidth: 2,
    borderColor: LINE,
  },
  areaSmallBottom: { bottom: -2 },
  areaSmallTop: { top: -2 },
  slot: {
    position: 'absolute',
    width: TOKEN + 40,
    marginLeft: -(TOKEN + 40) / 2,
    marginTop: -TOKEN / 2,
    alignItems: 'center',
  },
  pressed: { opacity: 0.75 },
  tokenWrap: { alignItems: 'center', gap: 2 },
  token: {
    width: TOKEN,
    height: TOKEN,
    borderRadius: TOKEN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  tokenFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tokenEmpty: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: LINE,
    borderStyle: 'dashed',
  },
  tokenSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  tokenText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  tokenTextFilled: { color: colors.accentText, fontSize: 15 },
  tokenName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    maxWidth: TOKEN + 36,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
});

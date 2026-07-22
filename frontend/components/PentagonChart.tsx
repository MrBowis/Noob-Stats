import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { Atributos } from '../lib/types';

interface PentagonChartProps {
  atributos: Atributos;
  /** Lado del lienzo cuadrado. */
  size?: number;
}

interface Punto {
  x: number;
  y: number;
}

/** Ejes del pentágono, empezando arriba y girando en sentido horario. */
const EJES: { key: keyof Atributos; label: string }[] = [
  { key: 'ataque', label: 'ATA' },
  { key: 'tecnica', label: 'TÉC' },
  { key: 'tactica', label: 'TÁC' },
  { key: 'defensa', label: 'DEF' },
  { key: 'creatividad', label: 'CRE' },
];

/** Vértice del eje `i` a un radio `r` desde el centro `c`. */
function vertice(c: number, r: number, i: number): Punto {
  const angulo = -Math.PI / 2 + (i * 2 * Math.PI) / EJES.length;
  return { x: c + r * Math.cos(angulo), y: c + r * Math.sin(angulo) };
}

/**
 * Segmento recto entre dos puntos, dibujado como una View rotada.
 * Evita depender de react-native-svg.
 */
function Segmento({
  a,
  b,
  color,
  grosor = 1,
}: {
  a: Punto;
  b: Punto;
  color: string;
  grosor?: number;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo = Math.hypot(dx, dy);
  const angulo = `${Math.atan2(dy, dx)}rad`;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: a.x,
        top: a.y - grosor / 2,
        width: largo,
        height: grosor,
        backgroundColor: color,
        transform: [
          { translateX: -largo / 2 },
          { rotate: angulo },
          { translateX: largo / 2 },
        ],
      }}
    />
  );
}

/** Aristas del polígono cerrado que pasa por `puntos`. */
function Poligono({
  puntos,
  color,
  grosor = 1,
}: {
  puntos: Punto[];
  color: string;
  grosor?: number;
}) {
  return (
    <>
      {puntos.map((p, i) => (
        <Segmento
          key={i}
          a={p}
          b={puntos[(i + 1) % puntos.length]}
          color={color}
          grosor={grosor}
        />
      ))}
    </>
  );
}

/**
 * Gráfico radar de los cinco atributos deportivos. Los valores son una
 * valoración del perfil (0-100), no estadísticas de partidos.
 */
export function PentagonChart({ atributos, size = 220 }: PentagonChartProps) {
  const centro = size / 2;
  // Deja aire alrededor para las etiquetas de cada eje.
  const radio = centro - 26;

  const mallas = [0.25, 0.5, 0.75, 1].map((f) =>
    EJES.map((_, i) => vertice(centro, radio * f, i)),
  );
  const valores = EJES.map((eje, i) =>
    vertice(centro, (radio * Math.max(0, Math.min(100, atributos[eje.key]))) / 100, i),
  );

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        {/* Mallas concéntricas */}
        {mallas.map((puntos, i) => (
          <Poligono key={i} puntos={puntos} color={colors.border} />
        ))}

        {/* Ejes radiales */}
        {mallas[mallas.length - 1].map((p, i) => (
          <Segmento
            key={`eje-${i}`}
            a={{ x: centro, y: centro }}
            b={p}
            color={colors.border}
          />
        ))}

        {/* Polígono de valores */}
        <Poligono puntos={valores} color={colors.accent} grosor={2} />

        {/* Vértices */}
        {valores.map((p, i) => (
          <View
            key={`v-${i}`}
            style={[styles.punto, { left: p.x - 4, top: p.y - 4 }]}
          />
        ))}

        {/* Etiquetas de cada eje */}
        {EJES.map((eje, i) => {
          const p = vertice(centro, radio + 16, i);
          return (
            <View
              key={eje.key}
              style={[styles.etiqueta, { left: p.x - 26, top: p.y - 11 }]}
            >
              <Text style={styles.etiquetaTexto}>{eje.label}</Text>
              <Text style={styles.etiquetaValor}>{atributos[eje.key]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: spacing.md },
  punto: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  etiqueta: { position: 'absolute', width: 52, alignItems: 'center' },
  etiquetaTexto: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  etiquetaValor: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

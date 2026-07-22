import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface DateFieldProps {
  label: string;
  /** Valor en formato YYYY-MM-DD, o null/'' si no hay fecha. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

/** Parsea 'YYYY-MM-DD' sin depender de zonas horarias. */
function parseFecha(value: string | null): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Formatea a 'YYYY-MM-DD' en horario local (evita el desfase de toISOString). */
function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function diasDelMes(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Índice del primer día del mes con la semana empezando en lunes (0..6). */
function primerDiaSemana(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

/**
 * Selector de fecha multiplataforma (iOS, Android y web) construido con
 * primitivas de React Native: no depende de módulos nativos ni del DOM.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Selecciona una fecha',
}: DateFieldProps) {
  const seleccion = useMemo(() => parseFecha(value), [value]);
  const anioActual = useMemo(() => new Date().getFullYear(), []);

  const [abierto, setAbierto] = useState(false);
  const [vistaYear, setVistaYear] = useState(
    seleccion?.year ?? anioActual - 20,
  );
  const [vistaMonth, setVistaMonth] = useState(seleccion?.month ?? 0);
  const [modoYear, setModoYear] = useState(false);

  const abrir = () => {
    const actual = parseFecha(value);
    setVistaYear(actual?.year ?? anioActual - 20);
    setVistaMonth(actual?.month ?? 0);
    setModoYear(false);
    setAbierto(true);
  };

  const cambiarMes = (delta: number) => {
    let m = vistaMonth + delta;
    let y = vistaYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setVistaMonth(m);
    setVistaYear(y);
  };

  const seleccionar = (day: number) => {
    onChange(toIsoDate(vistaYear, vistaMonth, day));
    setAbierto(false);
  };

  const total = diasDelMes(vistaYear, vistaMonth);
  const offset = primerDiaSemana(vistaYear, vistaMonth);
  const celdas: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const anios = useMemo(
    () => Array.from({ length: 100 }, (_, i) => anioActual - i),
    [anioActual],
  );

  const texto = seleccion
    ? `${seleccion.day} ${MESES_CORTOS[seleccion.month]} ${seleccion.year}`
    : placeholder;

  return (
    <View style={styles.container}>
      <Text style={[typography.overline, styles.label]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${texto}`}
        onPress={abrir}
        style={styles.input}
      >
        <Text style={[styles.inputText, !seleccion ? styles.placeholder : null]}>
          {texto}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAbierto(false)} />
        <View style={styles.sheet}>
          {/* Encabezado: mes y año */}
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Mes anterior"
              onPress={() => cambiarMes(-1)}
              hitSlop={8}
              style={styles.navBtn}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>

            <Pressable onPress={() => setModoYear((v) => !v)} hitSlop={8}>
              <Text style={styles.headerTitle}>
                {MESES[vistaMonth]} {vistaYear}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Mes siguiente"
              onPress={() => cambiarMes(1)}
              hitSlop={8}
              style={styles.navBtn}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          {modoYear ? (
            <ScrollView contentContainerStyle={styles.yearGrid}>
              {anios.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => {
                    setVistaYear(y);
                    setModoYear(false);
                  }}
                  style={[
                    styles.yearCell,
                    y === vistaYear ? styles.cellSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.yearText,
                      y === vistaYear ? styles.textSelected : null,
                    ]}
                  >
                    {y}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={styles.weekRow}>
                {DIAS.map((d, i) => (
                  <Text key={`${d}-${i}`} style={styles.weekLabel}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.grid}>
                {celdas.map((day, i) => {
                  if (day === null) {
                    return <View key={`v-${i}`} style={styles.cell} />;
                  }
                  const activo =
                    seleccion?.year === vistaYear &&
                    seleccion?.month === vistaMonth &&
                    seleccion?.day === day;
                  return (
                    <Pressable
                      key={day}
                      onPress={() => seleccionar(day)}
                      style={[
                        styles.cell,
                        activo ? styles.cellSelected : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          activo ? styles.textSelected : null,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                onChange(null);
                setAbierto(false);
              }}
              hitSlop={8}
            >
              <Text style={styles.footerAction}>Limpiar</Text>
            </Pressable>
            <Pressable onPress={() => setAbierto(false)} hitSlop={8}>
              <Text style={[styles.footerAction, styles.footerClose]}>
                Cerrar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  inputText: { color: colors.textPrimary, fontSize: 16 },
  placeholder: { color: colors.textSecondary },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '15%',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekLabel: {
    ...typography.overline,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
  },
  cellSelected: { backgroundColor: colors.accent },
  cellText: { color: colors.textPrimary, fontSize: 14 },
  textSelected: { color: colors.accentText, fontWeight: '800' },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: spacing.sm,
  },
  yearCell: {
    width: `${100 / 4}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
  },
  yearText: { color: colors.textPrimary, fontSize: 15 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerAction: { color: colors.live, fontSize: 14, fontWeight: '700' },
  footerClose: { color: colors.accent },
});

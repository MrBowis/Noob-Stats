import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { TextField } from './TextField';

interface DateTimeFieldProps {
  label: string;
  /** Valor en ISO 8601 o null. */
  value: string | null;
  onChange: (iso: string | null) => void;
  errorText?: string;
}

function onlyDigits(text: string): string {
  return text.replace(/\D/g, '');
}

function maskFecha(text: string): string {
  const d = onlyDigits(text).slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

function maskHora(text: string): string {
  const d = onlyDigits(text).slice(0, 4);
  const parts = [d.slice(0, 2), d.slice(2, 4)].filter(Boolean);
  return parts.join(':');
}

function buildIso(fecha: string, hora: string): string | null {
  const fm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
  const hm = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!fm || !hm) return null;
  const day = Number(fm[1]);
  const month = Number(fm[2]);
  const year = Number(fm[3]);
  const hour = Number(hm[1]);
  const minute = Number(hm[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null; // fecha inexistente (p. ej. 31/02)
  }
  return date.toISOString();
}

function seedFecha(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function seedHora(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mi}`;
}

/**
 * Entrada de fecha y hora sin dependencias nativas: dos campos enmascarados
 * (DD/MM/AAAA y HH:mm) que producen un ISO 8601 vía `onChange`.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  errorText,
}: DateTimeFieldProps) {
  const [fecha, setFecha] = useState(() => seedFecha(value));
  const [hora, setHora] = useState(() => seedHora(value));

  const emit = (nextFecha: string, nextHora: string) => {
    onChange(buildIso(nextFecha, nextHora));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.overline, styles.label]}>{label}</Text>
      <View style={styles.row}>
        <View style={styles.fecha}>
          <TextField
            label="Fecha"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            value={fecha}
            onChangeText={(t) => {
              const masked = maskFecha(t);
              setFecha(masked);
              emit(masked, hora);
            }}
          />
        </View>
        <View style={styles.hora}>
          <TextField
            label="Hora"
            placeholder="HH:mm"
            keyboardType="number-pad"
            value={hora}
            onChangeText={(t) => {
              const masked = maskHora(t);
              setHora(masked);
              emit(fecha, masked);
            }}
          />
        </View>
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fecha: {
    flex: 2,
  },
  hora: {
    flex: 1,
  },
  error: {
    ...typography.body,
    color: colors.live,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
});

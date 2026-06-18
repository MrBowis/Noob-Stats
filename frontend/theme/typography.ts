import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Escala tipográfica del sistema visual.
 *  - title: titulares (24-28pt, bold)
 *  - overline: etiquetas de campo en mayúsculas con tracking amplio
 *  - body: cuerpo, ayudas y textos legales
 */
export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  buttonLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

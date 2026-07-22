/**
 * Tokens de color del sistema visual de Noob Stats.
 * Tema oscuro con acento verde neón.
 */
export const colors = {
  background: '#0B0B0C', // Fondo base de toda la app
  surface: '#1C1C1E', // Tarjetas, inputs, contenedores
  accent: '#C6FF1A', // Botones primarios y elementos de acción
  accentText: '#0B0B0C', // Texto sobre el accent (alto contraste)
  live: '#FF3B30', // Estados "en vivo" / error puntual
  success: '#2ECC71', // Confirmaciones y mensajes exitosos
  textPrimary: '#FFFFFF', // Titulares
  textSecondary: '#9CA3AF', // Metadatos, ayudas, placeholders
  border: '#2A2A2D', // Bordes sutiles sobre surface
} as const;

export type ColorToken = keyof typeof colors;

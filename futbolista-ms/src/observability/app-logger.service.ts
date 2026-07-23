import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { getRequestId } from './request-context';
import { SERVICE_NAME } from './tokens';

type Nivel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

// Orden de severidad: un nivel se emite si su índice es <= al umbral.
const NIVELES: Nivel[] = ['error', 'warn', 'info', 'debug', 'verbose'];

/**
 * Logger estructurado en JSON, una línea por evento. Adjunta service,
 * timestamp, nivel, requestId (si hay contexto de petición) y context.
 *
 * El nivel se controla con LOG_LEVEL (por defecto "info"). Nunca registra
 * secretos: sólo emite lo que recibe de la aplicación.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly umbral: number;

  constructor(@Inject(SERVICE_NAME) private readonly service: string) {
    const nivel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
    const idx = NIVELES.indexOf(nivel as Nivel);
    this.umbral = idx === -1 ? NIVELES.indexOf('info') : idx;
  }

  log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.write('error', message, context, stack);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(
    level: Nivel,
    message: unknown,
    context?: string,
    stack?: string,
  ): void {
    if (NIVELES.indexOf(level) > this.umbral) return;

    const requestId = getRequestId();
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message: typeof message === 'string' ? message : this.safe(message),
    };
    if (requestId) entry.requestId = requestId;
    if (context) entry.context = context;
    if (stack) entry.stack = stack;

    const line = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  }

  private safe(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

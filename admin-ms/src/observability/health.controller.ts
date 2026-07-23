import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SERVICE_NAME } from './tokens';

interface HealthResponse {
  status: 'ok';
  service: string;
}

/**
 * Sonda de vida del microservicio. Respuesta deliberadamente mínima: no
 * expone configuración, variables de entorno ni datos de Supabase.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(SERVICE_NAME) private readonly serviceName: string) {}

  @ApiOperation({ summary: 'Estado de vida del microservicio' })
  @ApiOkResponse({ schema: { example: { status: 'ok', service: 'auth-ms' } } })
  @Get()
  check(): HealthResponse {
    return { status: 'ok', service: this.serviceName };
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { GetEstadisticasUseCase } from '../application/get-estadisticas.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { EstadisticasAdminResponseDto } from './dto/estadisticas-response.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('estadisticas')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly getEstadisticas: GetEstadisticasUseCase) {}

  @ApiOperation({
    summary: 'Estadísticas globales para el panel de administración',
    description:
      'Usuarios registrados (total/activos/inactivos), total de equipos y tabla de posiciones por equipo.',
  })
  @ApiOkResponse({ type: EstadisticasAdminResponseDto })
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.getEstadisticas.execute({ authId: user.id });
  }
}

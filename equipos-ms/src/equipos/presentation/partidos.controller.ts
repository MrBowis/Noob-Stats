import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { DeleteGolUseCase } from '../application/delete-gol.use-case';
import { DeletePartidoUseCase } from '../application/delete-partido.use-case';
import { DeleteTarjetaUseCase } from '../application/delete-tarjeta.use-case';
import { GetPartidoUseCase } from '../application/get-partido.use-case';
import { RegisterGolUseCase } from '../application/register-gol.use-case';
import { RegisterTarjetaUseCase } from '../application/register-tarjeta.use-case';
import { UpdatePartidoUseCase } from '../application/update-partido.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  GolResponseDto,
  PartidoDetalleResponseDto,
  PartidoResponseDto,
  TarjetaResponseDto,
} from './dto/partido-response.dto';
import { RegisterGolDto } from './dto/register-gol.dto';
import { RegisterTarjetaDto } from './dto/register-tarjeta.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('partidos')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('partidos')
export class PartidosController {
  constructor(
    private readonly getPartido: GetPartidoUseCase,
    private readonly updatePartido: UpdatePartidoUseCase,
    private readonly deletePartido: DeletePartidoUseCase,
    private readonly registerGol: RegisterGolUseCase,
    private readonly deleteGol: DeleteGolUseCase,
    private readonly registerTarjeta: RegisterTarjetaUseCase,
    private readonly deleteTarjeta: DeleteTarjetaUseCase,
  ) {}

  @ApiOperation({
    summary: 'Detalle de un partido con goleadores y tarjetas',
    description: 'Accesible para el entrenador propietario o un miembro.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiOkResponse({ type: PartidoDetalleResponseDto })
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getPartido.execute({ authId: user.id, partidoId: id });
  }

  @ApiOperation({
    summary: 'Actualizar un partido o registrar su resultado',
    description:
      'Sólo el entrenador propietario. Para registrar el resultado, envía estado="finalizado" con golesFavor y golesContra.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiOkResponse({ type: PartidoResponseDto })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePartidoDto,
  ) {
    return this.updatePartido.execute({
      authId: user.id,
      partidoId: id,
      ...dto,
    });
  }

  @ApiOperation({
    summary: 'Eliminar un partido',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiNoContentResponse({ description: 'Partido eliminado.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deletePartido.execute({ authId: user.id, partidoId: id });
  }

  // ---------------- Goles ----------------

  @ApiOperation({
    summary: 'Registrar un gol del equipo en el partido',
    description:
      'Sólo el entrenador propietario. El goleador debe ser del equipo.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiCreatedResponse({ type: GolResponseDto })
  @Post(':id/goles')
  addGol(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RegisterGolDto,
  ) {
    return this.registerGol.execute({
      authId: user.id,
      partidoId: id,
      usuarioId: dto.usuarioId,
      minuto: dto.minuto,
    });
  }

  @ApiOperation({
    summary: 'Eliminar un gol registrado',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiParam({ name: 'golId', description: 'ID del gol' })
  @ApiNoContentResponse({ description: 'Gol eliminado.' })
  @Delete(':id/goles/:golId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGol(
    @CurrentUser() user: AuthUser,
    @Param('golId') golId: string,
  ) {
    await this.deleteGol.execute({ authId: user.id, golId });
  }

  // ---------------- Tarjetas ----------------

  @ApiOperation({
    summary: 'Registrar una tarjeta (amarilla/roja) en el partido',
    description:
      'Sólo el entrenador propietario. El jugador amonestado debe ser del equipo.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiCreatedResponse({ type: TarjetaResponseDto })
  @Post(':id/tarjetas')
  addTarjeta(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RegisterTarjetaDto,
  ) {
    return this.registerTarjeta.execute({
      authId: user.id,
      partidoId: id,
      usuarioId: dto.usuarioId,
      tipo: dto.tipo,
      minuto: dto.minuto,
    });
  }

  @ApiOperation({
    summary: 'Eliminar una tarjeta registrada',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del partido' })
  @ApiParam({ name: 'tarjetaId', description: 'ID de la tarjeta' })
  @ApiNoContentResponse({ description: 'Tarjeta eliminada.' })
  @Delete(':id/tarjetas/:tarjetaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTarjeta(
    @CurrentUser() user: AuthUser,
    @Param('tarjetaId') tarjetaId: string,
  ) {
    await this.deleteTarjeta.execute({ authId: user.id, tarjetaId });
  }
}

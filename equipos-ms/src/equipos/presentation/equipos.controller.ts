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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { PartidoFiltro } from '../domain/repositories/equipos.repository';
import { CreateEquipoUseCase } from '../application/create-equipo.use-case';
import { CreatePartidoUseCase } from '../application/create-partido.use-case';
import { DeleteEquipoUseCase } from '../application/delete-equipo.use-case';
import { GetEquipoUseCase } from '../application/get-equipo.use-case';
import { GetEstadisticasUseCase } from '../application/get-estadisticas.use-case';
import { InvitarJugadorUseCase } from '../application/invitar-jugador.use-case';
import { ListInvitacionesEquipoUseCase } from '../application/list-invitaciones-equipo.use-case';
import { ListMiembrosUseCase } from '../application/list-miembros.use-case';
import { ListMisEquiposUseCase } from '../application/list-mis-equipos.use-case';
import { ListPartidosUseCase } from '../application/list-partidos.use-case';
import { RemoveMiembroUseCase } from '../application/remove-miembro.use-case';
import { UpdateEquipoUseCase } from '../application/update-equipo.use-case';
import { UpdateMiembroUseCase } from '../application/update-miembro.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { EquipoResponseDto } from './dto/equipo-response.dto';
import { EstadisticasEquipoResponseDto } from './dto/estadisticas-response.dto';
import {
  InvitacionDetalleResponseDto,
  InvitacionResponseDto,
} from './dto/invitacion-response.dto';
import { InvitarJugadorDto } from './dto/invitar-jugador.dto';
import {
  EquipoMiembroResponseDto,
  MiembroDetalleResponseDto,
} from './dto/miembro-response.dto';
import { PartidoResponseDto } from './dto/partido-response.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('equipos')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('equipos')
export class EquiposController {
  constructor(
    private readonly createEquipo: CreateEquipoUseCase,
    private readonly listMisEquipos: ListMisEquiposUseCase,
    private readonly getEquipo: GetEquipoUseCase,
    private readonly updateEquipo: UpdateEquipoUseCase,
    private readonly deleteEquipo: DeleteEquipoUseCase,
    private readonly listMiembros: ListMiembrosUseCase,
    private readonly updateMiembro: UpdateMiembroUseCase,
    private readonly removeMiembro: RemoveMiembroUseCase,
    private readonly invitarJugador: InvitarJugadorUseCase,
    private readonly listInvitacionesEquipo: ListInvitacionesEquipoUseCase,
    private readonly createPartido: CreatePartidoUseCase,
    private readonly listPartidos: ListPartidosUseCase,
    private readonly getEstadisticas: GetEstadisticasUseCase,
  ) {}

  // ---------------- Equipos ----------------

  @ApiOperation({
    summary: 'Crear un equipo',
    description: 'Sólo un Entrenador puede crear equipos.',
  })
  @ApiCreatedResponse({ type: EquipoResponseDto })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEquipoDto) {
    return this.createEquipo.execute({ authId: user.id, ...dto });
  }

  @ApiOperation({
    summary: 'Listar mis equipos',
    description:
      'Equipos donde el usuario es el entrenador o forma parte como jugador.',
  })
  @ApiOkResponse({ type: EquipoResponseDto, isArray: true })
  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.listMisEquipos.execute({ authId: user.id });
  }

  @ApiOperation({ summary: 'Obtener el detalle de un equipo' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiOkResponse({ type: EquipoResponseDto })
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getEquipo.execute({ authId: user.id, equipoId: id });
  }

  @ApiOperation({
    summary: 'Actualizar un equipo',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiOkResponse({ type: EquipoResponseDto })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateEquipoDto,
  ) {
    return this.updateEquipo.execute({ authId: user.id, equipoId: id, ...dto });
  }

  @ApiOperation({
    summary: 'Eliminar un equipo',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiNoContentResponse({ description: 'Equipo eliminado.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteEquipo.execute({ authId: user.id, equipoId: id });
  }

  // ---------------- Miembros ----------------

  @ApiOperation({ summary: 'Listar los miembros (plantilla) del equipo' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiOkResponse({ type: MiembroDetalleResponseDto, isArray: true })
  @Get(':id/miembros')
  miembros(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listMiembros.execute({ authId: user.id, equipoId: id });
  }

  @ApiOperation({
    summary: 'Actualizar un miembro (dorsal, posición, estado)',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiParam({ name: 'usuarioId', description: 'ID (usuario) del jugador' })
  @ApiOkResponse({ type: EquipoMiembroResponseDto })
  @Patch(':id/miembros/:usuarioId')
  editMiembro(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('usuarioId') usuarioId: string,
    @Body() dto: UpdateMiembroDto,
  ) {
    return this.updateMiembro.execute({
      authId: user.id,
      equipoId: id,
      usuarioId,
      ...dto,
    });
  }

  @ApiOperation({
    summary: 'Eliminar un jugador del equipo',
    description:
      'El entrenador puede sacar a cualquier jugador; un jugador puede salir del equipo por sí mismo.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiParam({ name: 'usuarioId', description: 'ID (usuario) del jugador' })
  @ApiNoContentResponse({ description: 'Jugador eliminado del equipo.' })
  @Delete(':id/miembros/:usuarioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async kickMiembro(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('usuarioId') usuarioId: string,
  ) {
    await this.removeMiembro.execute({
      authId: user.id,
      equipoId: id,
      usuarioId,
    });
  }

  // ---------------- Invitaciones ----------------

  @ApiOperation({
    summary: 'Invitar a un jugador al equipo',
    description:
      'El entrenador envía una invitación por correo; el jugador debe aceptarla para unirse.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiCreatedResponse({ type: InvitacionResponseDto })
  @Post(':id/invitaciones')
  invitar(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: InvitarJugadorDto,
  ) {
    return this.invitarJugador.execute({
      authId: user.id,
      equipoId: id,
      jugadorEmail: dto.jugadorEmail,
      mensaje: dto.mensaje,
    });
  }

  @ApiOperation({
    summary: 'Listar las invitaciones del equipo',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiOkResponse({ type: InvitacionDetalleResponseDto, isArray: true })
  @Get(':id/invitaciones')
  invitaciones(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listInvitacionesEquipo.execute({
      authId: user.id,
      equipoId: id,
    });
  }

  // ---------------- Partidos ----------------

  @ApiOperation({
    summary: 'Programar un partido',
    description: 'Sólo el entrenador propietario.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiCreatedResponse({ type: PartidoResponseDto })
  @Post(':id/partidos')
  programarPartido(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreatePartidoDto,
  ) {
    return this.createPartido.execute({
      authId: user.id,
      equipoId: id,
      rival: dto.rival,
      fecha: dto.fecha,
      ubicacion: dto.ubicacion,
      esLocal: dto.esLocal,
      notas: dto.notas,
    });
  }

  @ApiOperation({
    summary: 'Listar los partidos del equipo',
    description:
      'Filtra por próximos (programados a futuro), anteriores (finalizados) o todos.',
  })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: ['proximos', 'anteriores', 'todos'],
  })
  @ApiOkResponse({ type: PartidoResponseDto, isArray: true })
  @Get(':id/partidos')
  partidos(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('tipo') tipo?: string,
  ) {
    const filtro: PartidoFiltro =
      tipo === 'proximos' || tipo === 'anteriores' ? tipo : 'todos';
    return this.listPartidos.execute({
      authId: user.id,
      equipoId: id,
      filtro,
    });
  }

  // ---------------- Estadísticas ----------------

  @ApiOperation({ summary: 'Obtener las estadísticas generales del equipo' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiOkResponse({ type: EstadisticasEquipoResponseDto })
  @Get(':id/estadisticas')
  estadisticas(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getEstadisticas.execute({ authId: user.id, equipoId: id });
  }
}

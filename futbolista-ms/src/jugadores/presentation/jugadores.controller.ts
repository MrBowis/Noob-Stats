import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AddPosicionUseCase } from '../application/add-posicion.use-case';
import { CreateJugadorUseCase } from '../application/create-jugador.use-case';
import { DeletePosicionUseCase } from '../application/delete-posicion.use-case';
import { GetAtributosUseCase } from '../application/get-atributos.use-case';
import { GetFisicoUseCase } from '../application/get-fisico.use-case';
import { GetJugadorUseCase } from '../application/get-jugador.use-case';
import { GetMiJugadorUseCase } from '../application/get-mi-jugador.use-case';
import { GetResumenAtributosUseCase } from '../application/get-resumen-atributos.use-case';
import { GetResumenUseCase } from '../application/get-resumen.use-case';
import { ListEquiposJugadorUseCase } from '../application/list-equipos-jugador.use-case';
import { ListJugadoresUseCase } from '../application/list-jugadores.use-case';
import { ListPosicionesUseCase } from '../application/list-posiciones.use-case';
import { UpdateAtributosUseCase } from '../application/update-atributos.use-case';
import { UpdateFisicoUseCase } from '../application/update-fisico.use-case';
import { UpdateJugadorUseCase } from '../application/update-jugador.use-case';
import { UpdatePosicionUseCase } from '../application/update-posicion.use-case';
import {
  TAMANIO_MAXIMO_BYTES,
  UploadFotoUseCase,
} from '../application/upload-foto.use-case';
import {
  ESTADOS_JUGADOR,
  PIERNAS_HABILES,
  POSICIONES,
} from '../domain/catalogos';
import type { EstadoJugador, PiernaHabil, Posicion } from '../domain/catalogos';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { AccessToken, CurrentUser } from './decorators/current-user.decorator';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import {
  EquipoDelJugadorResponseDto,
  JugadorAtributoResponseDto,
  JugadorFisicoResponseDto,
  JugadorPosicionResponseDto,
  JugadorResponseDto,
  ResumenAtributosResponseDto,
  ResumenJugadorResponseDto,
} from './dto/jugador-response.dto';
import { CreatePosicionDto, UpdatePosicionDto } from './dto/posicion.dto';
import { UpdateAtributosDto } from './dto/update-atributos.dto';
import { UpdateFisicoDto } from './dto/update-fisico.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('jugadores')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('jugadores')
export class JugadoresController {
  constructor(
    private readonly createJugador: CreateJugadorUseCase,
    private readonly listJugadores: ListJugadoresUseCase,
    private readonly getJugador: GetJugadorUseCase,
    private readonly getMiJugador: GetMiJugadorUseCase,
    private readonly updateJugador: UpdateJugadorUseCase,
    private readonly getFisico: GetFisicoUseCase,
    private readonly updateFisico: UpdateFisicoUseCase,
    private readonly listPosiciones: ListPosicionesUseCase,
    private readonly addPosicion: AddPosicionUseCase,
    private readonly updatePosicion: UpdatePosicionUseCase,
    private readonly deletePosicion: DeletePosicionUseCase,
    private readonly getAtributos: GetAtributosUseCase,
    private readonly updateAtributos: UpdateAtributosUseCase,
    private readonly getResumenAtributos: GetResumenAtributosUseCase,
    private readonly getResumen: GetResumenUseCase,
    private readonly listEquipos: ListEquiposJugadorUseCase,
    private readonly uploadFoto: UploadFotoUseCase,
  ) {}

  // ---------------- Perfil ----------------

  @ApiOperation({
    summary: 'Crear mi perfil de jugador',
    description:
      'El propietario se toma del token; el cliente no puede elegirlo.',
  })
  @ApiCreatedResponse({ type: JugadorResponseDto })
  @ApiConflictResponse({ description: 'El usuario ya tiene perfil' })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateJugadorDto) {
    return this.createJugador.execute({ authId: user.id, ...dto });
  }

  @ApiOperation({
    summary: 'Listar jugadores',
    description:
      'Consulta pública para cualquier usuario autenticado. El filtro por posición incluye principal y secundarias.',
  })
  @ApiQuery({ name: 'posicion', required: false, enum: POSICIONES })
  @ApiQuery({ name: 'piernaHabil', required: false, enum: PIERNAS_HABILES })
  @ApiQuery({ name: 'estado', required: false, enum: ESTADOS_JUGADOR })
  @ApiOkResponse({ type: JugadorResponseDto, isArray: true })
  @Get()
  list(
    @Query('posicion') posicion?: Posicion,
    @Query('piernaHabil') piernaHabil?: PiernaHabil,
    @Query('estado') estado?: EstadoJugador,
  ) {
    return this.listJugadores.execute({ posicion, piernaHabil, estado });
  }

  @ApiOperation({ summary: 'Obtener mi propio perfil' })
  @ApiOkResponse({ type: JugadorResponseDto })
  @Get('me')
  getMine(@CurrentUser() user: AuthUser) {
    return this.getMiJugador.execute({ authId: user.id });
  }

  @ApiOperation({ summary: 'Obtener la información pública de un jugador' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorResponseDto })
  @ApiNotFoundResponse({ description: 'El jugador no existe' })
  @Get(':jugadorId')
  getOne(@Param('jugadorId') jugadorId: string) {
    return this.getJugador.execute({ jugadorId });
  }

  @ApiOperation({
    summary: 'Actualizar mi perfil',
    description: 'Sólo el propietario del perfil puede modificarlo.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorResponseDto })
  @ApiForbiddenResponse({ description: 'No eres el propietario del perfil' })
  @Put(':jugadorId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Body() dto: UpdateJugadorDto,
  ) {
    return this.updateJugador.execute({ authId: user.id, jugadorId, ...dto });
  }

  @ApiOperation({
    summary: 'Subir mi foto de perfil',
    description:
      'Guarda la imagen en el bucket público de Supabase Storage y actualiza `fotoUrl`. Formatos: JPG, PNG, WEBP o GIF (máx. 5 MB).',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: JugadorResponseDto })
  @ApiForbiddenResponse({ description: 'No eres el propietario del perfil' })
  @Post(':jugadorId/foto')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: TAMANIO_MAXIMO_BYTES } }),
  )
  postFoto(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de imagen');
    }
    return this.uploadFoto.execute({
      authId: user.id,
      jugadorId,
      foto: {
        buffer: file.buffer,
        mimeType: file.mimetype,
        fileName: file.originalname,
      },
    });
  }

  // ---------------- Datos físicos ----------------

  @ApiOperation({ summary: 'Consultar los datos físicos de un jugador' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorFisicoResponseDto })
  @Get(':jugadorId/fisico')
  fisico(@Param('jugadorId') jugadorId: string) {
    return this.getFisico.execute({ jugadorId });
  }

  @ApiOperation({
    summary: 'Actualizar mis datos físicos',
    description: 'Sólo el propietario. Crea el registro si aún no existe.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorFisicoResponseDto })
  @ApiForbiddenResponse({ description: 'No eres el propietario del perfil' })
  @Put(':jugadorId/fisico')
  putFisico(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Body() dto: UpdateFisicoDto,
  ) {
    return this.updateFisico.execute({ authId: user.id, jugadorId, ...dto });
  }

  // ---------------- Posiciones ----------------

  @ApiOperation({ summary: 'Listar las posiciones de un jugador' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorPosicionResponseDto, isArray: true })
  @Get(':jugadorId/posiciones')
  posiciones(@Param('jugadorId') jugadorId: string) {
    return this.listPosiciones.execute({ jugadorId });
  }

  @ApiOperation({
    summary: 'Añadir una posición',
    description:
      'Un jugador tiene como máximo una posición principal y varias secundarias.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiCreatedResponse({ type: JugadorPosicionResponseDto })
  @ApiConflictResponse({ description: 'La posición ya está registrada' })
  @Post(':jugadorId/posiciones')
  postPosicion(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Body() dto: CreatePosicionDto,
  ) {
    return this.addPosicion.execute({ authId: user.id, jugadorId, ...dto });
  }

  @ApiOperation({ summary: 'Actualizar una posición' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiParam({ name: 'posicionId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorPosicionResponseDto })
  @Put(':jugadorId/posiciones/:posicionId')
  putPosicion(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Param('posicionId') posicionId: string,
    @Body() dto: UpdatePosicionDto,
  ) {
    return this.updatePosicion.execute({
      authId: user.id,
      jugadorId,
      posicionId,
      ...dto,
    });
  }

  @ApiOperation({ summary: 'Eliminar una posición' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiParam({ name: 'posicionId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':jugadorId/posiciones/:posicionId')
  removePosicion(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Param('posicionId') posicionId: string,
  ) {
    return this.deletePosicion.execute({
      authId: user.id,
      jugadorId,
      posicionId,
    });
  }

  // ---------------- Atributos ----------------

  @ApiOperation({
    summary: 'Consultar los atributos deportivos',
    description:
      'Valoración del perfil (0-100). No son estadísticas de partidos: ésas las sirve equipos-ms.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorAtributoResponseDto })
  @Get(':jugadorId/atributos')
  atributos(@Param('jugadorId') jugadorId: string) {
    return this.getAtributos.execute({ jugadorId });
  }

  @ApiOperation({ summary: 'Actualizar mis atributos deportivos' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorAtributoResponseDto })
  @ApiForbiddenResponse({ description: 'No eres el propietario del perfil' })
  @Put(':jugadorId/atributos')
  putAtributos(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Body() dto: UpdateAtributosDto,
  ) {
    return this.updateAtributos.execute({ authId: user.id, jugadorId, ...dto });
  }

  @ApiOperation({
    summary: 'Atributos para el pentágono',
    description:
      'Respuesta mínima optimizada para el gráfico radar del frontend.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: ResumenAtributosResponseDto })
  @Get(':jugadorId/resumen-atributos')
  resumenAtributos(@Param('jugadorId') jugadorId: string) {
    return this.getResumenAtributos.execute({ jugadorId });
  }

  // ---------------- Resumen e integración ----------------

  @ApiOperation({
    summary: 'Resumen del jugador (tarjeta de perfil)',
    description:
      'Nombre y fecha de nacimiento se leen de auth-ms; no se almacenan aquí.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: ResumenJugadorResponseDto })
  @Get(':jugadorId/resumen')
  resumen(@Param('jugadorId') jugadorId: string) {
    return this.getResumen.execute({ jugadorId });
  }

  @ApiOperation({
    summary: 'Equipos del jugador',
    description:
      'Read-through a equipos-ms. Restringido al propietario porque equipos-ms sólo resuelve los equipos del usuario del token.',
  })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiOkResponse({ type: EquipoDelJugadorResponseDto, isArray: true })
  @ApiForbiddenResponse({ description: 'No eres el propietario del perfil' })
  @Get(':jugadorId/equipos')
  equipos(
    @CurrentUser() user: AuthUser,
    @AccessToken() accessToken: string,
    @Param('jugadorId') jugadorId: string,
  ) {
    return this.listEquipos.execute({
      authId: user.id,
      accessToken,
      jugadorId,
    });
  }
}

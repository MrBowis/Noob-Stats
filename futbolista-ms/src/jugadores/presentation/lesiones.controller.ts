import {
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLesionUseCase } from '../application/create-lesion.use-case';
import { DeleteLesionUseCase } from '../application/delete-lesion.use-case';
import { ListLesionesUseCase } from '../application/list-lesiones.use-case';
import { UpdateLesionUseCase } from '../application/update-lesion.use-case';
import { ESTADOS_LESION } from '../domain/catalogos';
import type { EstadoLesion } from '../domain/catalogos';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { JugadorLesionResponseDto } from './dto/jugador-response.dto';
import { CreateLesionDto, UpdateLesionDto } from './dto/lesion.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

/**
 * Historial de lesiones del jugador. Alcance médico limitado: parte del
 * cuerpo, estado, fechas y una nota breve.
 */
@ApiTags('lesiones')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('jugadores/:jugadorId/lesiones')
export class LesionesController {
  constructor(
    private readonly listLesiones: ListLesionesUseCase,
    private readonly createLesion: CreateLesionUseCase,
    private readonly updateLesion: UpdateLesionUseCase,
    private readonly deleteLesion: DeleteLesionUseCase,
  ) {}

  @ApiOperation({ summary: 'Historial de lesiones de un jugador' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiQuery({ name: 'estado', required: false, enum: ESTADOS_LESION })
  @ApiOkResponse({ type: JugadorLesionResponseDto, isArray: true })
  @Get()
  list(
    @Param('jugadorId') jugadorId: string,
    @Query('estado') estado?: EstadoLesion,
  ) {
    return this.listLesiones.execute({ jugadorId, estado });
  }

  @ApiOperation({ summary: 'Registrar una lesión' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiCreatedResponse({ type: JugadorLesionResponseDto })
  @ApiForbiddenResponse({ description: 'No eres el propietario del perfil' })
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Body() dto: CreateLesionDto,
  ) {
    return this.createLesion.execute({ authId: user.id, jugadorId, ...dto });
  }

  @ApiOperation({ summary: 'Actualizar una lesión' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiParam({ name: 'lesionId', format: 'uuid' })
  @ApiOkResponse({ type: JugadorLesionResponseDto })
  @Put(':lesionId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Param('lesionId') lesionId: string,
    @Body() dto: UpdateLesionDto,
  ) {
    return this.updateLesion.execute({
      authId: user.id,
      jugadorId,
      lesionId,
      ...dto,
    });
  }

  @ApiOperation({ summary: 'Eliminar una lesión' })
  @ApiParam({ name: 'jugadorId', format: 'uuid' })
  @ApiParam({ name: 'lesionId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':lesionId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('jugadorId') jugadorId: string,
    @Param('lesionId') lesionId: string,
  ) {
    return this.deleteLesion.execute({ authId: user.id, jugadorId, lesionId });
  }
}

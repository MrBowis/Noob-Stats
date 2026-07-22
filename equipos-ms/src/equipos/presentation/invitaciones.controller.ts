import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { CancelarInvitacionUseCase } from '../application/cancelar-invitacion.use-case';
import { ListMisInvitacionesUseCase } from '../application/list-mis-invitaciones.use-case';
import { ResponderInvitacionUseCase } from '../application/responder-invitacion.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  InvitacionDetalleResponseDto,
  InvitacionResponseDto,
  ResponderInvitacionResponseDto,
} from './dto/invitacion-response.dto';
import { ResponderInvitacionDto } from './dto/responder-invitacion.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('invitaciones')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('invitaciones')
export class InvitacionesController {
  constructor(
    private readonly listMisInvitaciones: ListMisInvitacionesUseCase,
    private readonly responderInvitacion: ResponderInvitacionUseCase,
    private readonly cancelarInvitacion: CancelarInvitacionUseCase,
  ) {}

  @ApiOperation({
    summary: 'Listar mis invitaciones',
    description: 'Invitaciones recibidas por el usuario autenticado.',
  })
  @ApiQuery({
    name: 'pendientes',
    required: false,
    type: Boolean,
    description: 'Si es true, sólo devuelve las invitaciones pendientes.',
  })
  @ApiOkResponse({ type: InvitacionDetalleResponseDto, isArray: true })
  @Get('mias')
  mias(
    @CurrentUser() user: AuthUser,
    @Query('pendientes') pendientes?: string,
  ) {
    return this.listMisInvitaciones.execute({
      authId: user.id,
      soloPendientes: pendientes === 'true',
    });
  }

  @ApiOperation({
    summary: 'Responder una invitación',
    description: 'El jugador invitado acepta o rechaza la invitación.',
  })
  @ApiParam({ name: 'id', description: 'ID de la invitación' })
  @ApiOkResponse({ type: ResponderInvitacionResponseDto })
  @Post(':id/responder')
  @HttpCode(HttpStatus.OK)
  responder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ResponderInvitacionDto,
  ) {
    return this.responderInvitacion.execute({
      authId: user.id,
      invitacionId: id,
      aceptar: dto.aceptar,
    });
  }

  @ApiOperation({
    summary: 'Cancelar una invitación',
    description: 'El entrenador propietario cancela una invitación pendiente.',
  })
  @ApiParam({ name: 'id', description: 'ID de la invitación' })
  @ApiOkResponse({ type: InvitacionResponseDto })
  @Delete(':id')
  cancelar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cancelarInvitacion.execute({
      authId: user.id,
      invitacionId: id,
    });
  }
}

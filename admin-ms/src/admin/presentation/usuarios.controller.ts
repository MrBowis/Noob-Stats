import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { CreateUsuarioUseCase } from '../application/create-usuario.use-case';
import { DeactivateUsuarioUseCase } from '../application/deactivate-usuario.use-case';
import { GetUsuarioUseCase } from '../application/get-usuario.use-case';
import { ListUsuariosUseCase } from '../application/list-usuarios.use-case';
import { UpdateUsuarioUseCase } from '../application/update-usuario.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioDetalleResponseDto } from './dto/usuario-response.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly createUsuario: CreateUsuarioUseCase,
    private readonly listUsuarios: ListUsuariosUseCase,
    private readonly getUsuario: GetUsuarioUseCase,
    private readonly updateUsuario: UpdateUsuarioUseCase,
    private readonly deactivateUsuario: DeactivateUsuarioUseCase,
  ) {}

  @ApiOperation({
    summary: 'Crear un usuario',
    description:
      'Crea la Persona y el Usuario de dominio con el rol indicado. No crea una cuenta de acceso en Supabase Auth.',
  })
  @ApiCreatedResponse({ type: UsuarioDetalleResponseDto })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUsuarioDto) {
    return this.createUsuario.execute({ authId: user.id, ...dto });
  }

  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['activo', 'inactivo'],
    description: 'Filtra por estado del usuario.',
  })
  @ApiOkResponse({ type: UsuarioDetalleResponseDto, isArray: true })
  @Get()
  list(@CurrentUser() user: AuthUser, @Query('estado') estado?: string) {
    return this.listUsuarios.execute({ authId: user.id, estado });
  }

  @ApiOperation({ summary: 'Obtener un usuario por id' })
  @ApiParam({ name: 'id', description: 'ID (usuario) del usuario' })
  @ApiOkResponse({ type: UsuarioDetalleResponseDto })
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getUsuario.execute({ authId: user.id, usuarioId: id });
  }

  @ApiOperation({
    summary: 'Actualizar un usuario',
    description:
      'Permite editar los datos de la persona, reasignar el rol y cambiar el estado.',
  })
  @ApiParam({ name: 'id', description: 'ID (usuario) del usuario' })
  @ApiOkResponse({ type: UsuarioDetalleResponseDto })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.updateUsuario.execute({
      authId: user.id,
      usuarioId: id,
      ...dto,
    });
  }

  @ApiOperation({
    summary: 'Desactivar un usuario (borrado lógico)',
    description:
      'No elimina el registro: cambia el estado del usuario a "inactivo".',
  })
  @ApiParam({ name: 'id', description: 'ID (usuario) del usuario' })
  @ApiOkResponse({ type: UsuarioDetalleResponseDto })
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deactivateUsuario.execute({ authId: user.id, usuarioId: id });
  }
}

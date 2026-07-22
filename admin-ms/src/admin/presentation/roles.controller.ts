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
import { CreateRolUseCase } from '../application/create-rol.use-case';
import { DeleteRolUseCase } from '../application/delete-rol.use-case';
import { GetRolUseCase } from '../application/get-rol.use-case';
import { ListRolesUseCase } from '../application/list-roles.use-case';
import { UpdateRolUseCase } from '../application/update-rol.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateRolDto } from './dto/create-rol.dto';
import { RolResponseDto } from './dto/rol-response.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly createRol: CreateRolUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly getRol: GetRolUseCase,
    private readonly updateRol: UpdateRolUseCase,
    private readonly deleteRol: DeleteRolUseCase,
  ) {}

  @ApiOperation({ summary: 'Crear un rol' })
  @ApiCreatedResponse({ type: RolResponseDto })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRolDto) {
    return this.createRol.execute({ authId: user.id, ...dto });
  }

  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiOkResponse({ type: RolResponseDto, isArray: true })
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.listRoles.execute({ authId: user.id });
  }

  @ApiOperation({ summary: 'Obtener un rol por id' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiOkResponse({ type: RolResponseDto })
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getRol.execute({ authId: user.id, rolId: id });
  }

  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiOkResponse({ type: RolResponseDto })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRolDto,
  ) {
    return this.updateRol.execute({ authId: user.id, rolId: id, ...dto });
  }

  @ApiOperation({
    summary: 'Eliminar un rol',
    description:
      'Falla con 409 si el rol tiene usuarios asignados (no es borrado lógico).',
  })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiNoContentResponse({ description: 'Rol eliminado.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteRol.execute({ authId: user.id, rolId: id });
  }
}

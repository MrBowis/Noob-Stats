import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AdminAccessService } from './application/admin-access.service';
import { CreateRolUseCase } from './application/create-rol.use-case';
import { CreateUsuarioUseCase } from './application/create-usuario.use-case';
import { DeactivateUsuarioUseCase } from './application/deactivate-usuario.use-case';
import { DeleteRolUseCase } from './application/delete-rol.use-case';
import { GetEstadisticasUseCase } from './application/get-estadisticas.use-case';
import { GetRolUseCase } from './application/get-rol.use-case';
import { GetUsuarioUseCase } from './application/get-usuario.use-case';
import { ListRolesUseCase } from './application/list-roles.use-case';
import { ListUsuariosUseCase } from './application/list-usuarios.use-case';
import { UpdateRolUseCase } from './application/update-rol.use-case';
import { UpdateUsuarioUseCase } from './application/update-usuario.use-case';
import { AdminRepository } from './domain/repositories/admin.repository';
import { SupabaseAdminRepository } from './infrastructure/supabase-admin.repository';
import { EstadisticasController } from './presentation/estadisticas.controller';
import { RolesController } from './presentation/roles.controller';
import { UsuariosController } from './presentation/usuarios.controller';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { SupabaseAuthGuard } from './presentation/guards/supabase-auth.guard';

@Module({
  controllers: [RolesController, UsuariosController, EstadisticasController],
  providers: [
    // Puerto -> adaptador (los casos de uso dependen de la interfaz, no de Supabase)
    { provide: AdminRepository, useClass: SupabaseAdminRepository },
    AdminAccessService,
    // Roles
    CreateRolUseCase,
    ListRolesUseCase,
    GetRolUseCase,
    UpdateRolUseCase,
    DeleteRolUseCase,
    // Usuarios
    CreateUsuarioUseCase,
    ListUsuariosUseCase,
    GetUsuarioUseCase,
    UpdateUsuarioUseCase,
    DeactivateUsuarioUseCase,
    // Estadísticas
    GetEstadisticasUseCase,
    // Infra transversal
    SupabaseAuthGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AdminModule {}

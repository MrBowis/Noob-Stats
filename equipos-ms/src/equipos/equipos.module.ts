import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CancelarInvitacionUseCase } from './application/cancelar-invitacion.use-case';
import { CreateEquipoUseCase } from './application/create-equipo.use-case';
import { CreatePartidoUseCase } from './application/create-partido.use-case';
import { DeleteEquipoUseCase } from './application/delete-equipo.use-case';
import { DeleteGolUseCase } from './application/delete-gol.use-case';
import { DeletePartidoUseCase } from './application/delete-partido.use-case';
import { DeleteTarjetaUseCase } from './application/delete-tarjeta.use-case';
import { EquipoAccessService } from './application/equipo-access.service';
import { GetEquipoUseCase } from './application/get-equipo.use-case';
import { GetEstadisticasUseCase } from './application/get-estadisticas.use-case';
import { GetPartidoUseCase } from './application/get-partido.use-case';
import { InvitarJugadorUseCase } from './application/invitar-jugador.use-case';
import { ListInvitacionesEquipoUseCase } from './application/list-invitaciones-equipo.use-case';
import { ListMiembrosUseCase } from './application/list-miembros.use-case';
import { ListMisEquiposUseCase } from './application/list-mis-equipos.use-case';
import { ListMisInvitacionesUseCase } from './application/list-mis-invitaciones.use-case';
import { ListPartidosUseCase } from './application/list-partidos.use-case';
import { RegisterGolUseCase } from './application/register-gol.use-case';
import { RegisterTarjetaUseCase } from './application/register-tarjeta.use-case';
import { RemoveMiembroUseCase } from './application/remove-miembro.use-case';
import { ResponderInvitacionUseCase } from './application/responder-invitacion.use-case';
import { UpdateEquipoUseCase } from './application/update-equipo.use-case';
import { UpdateMiembroUseCase } from './application/update-miembro.use-case';
import { UpdatePartidoUseCase } from './application/update-partido.use-case';
import { EquiposRepository } from './domain/repositories/equipos.repository';
import { SupabaseEquiposRepository } from './infrastructure/supabase-equipos.repository';
import { EquiposController } from './presentation/equipos.controller';
import { InvitacionesController } from './presentation/invitaciones.controller';
import { PartidosController } from './presentation/partidos.controller';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { SupabaseAuthGuard } from './presentation/guards/supabase-auth.guard';

@Module({
  controllers: [EquiposController, InvitacionesController, PartidosController],
  providers: [
    // Puerto -> adaptador (los casos de uso dependen de la interfaz, no de Supabase)
    { provide: EquiposRepository, useClass: SupabaseEquiposRepository },
    EquipoAccessService,
    // Equipos
    CreateEquipoUseCase,
    ListMisEquiposUseCase,
    GetEquipoUseCase,
    UpdateEquipoUseCase,
    DeleteEquipoUseCase,
    // Miembros
    ListMiembrosUseCase,
    UpdateMiembroUseCase,
    RemoveMiembroUseCase,
    // Invitaciones
    InvitarJugadorUseCase,
    ListInvitacionesEquipoUseCase,
    ListMisInvitacionesUseCase,
    ResponderInvitacionUseCase,
    CancelarInvitacionUseCase,
    // Partidos
    CreatePartidoUseCase,
    ListPartidosUseCase,
    GetPartidoUseCase,
    UpdatePartidoUseCase,
    DeletePartidoUseCase,
    // Goles y tarjetas
    RegisterGolUseCase,
    DeleteGolUseCase,
    RegisterTarjetaUseCase,
    DeleteTarjetaUseCase,
    // Estadísticas
    GetEstadisticasUseCase,
    // Infra transversal
    SupabaseAuthGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class EquiposModule {}

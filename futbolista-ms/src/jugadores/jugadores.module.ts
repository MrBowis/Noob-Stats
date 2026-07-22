import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AddPosicionUseCase } from './application/add-posicion.use-case';
import { CreateJugadorUseCase } from './application/create-jugador.use-case';
import { CreateLesionUseCase } from './application/create-lesion.use-case';
import { DeleteLesionUseCase } from './application/delete-lesion.use-case';
import { DeletePosicionUseCase } from './application/delete-posicion.use-case';
import { GetAtributosUseCase } from './application/get-atributos.use-case';
import { GetFisicoUseCase } from './application/get-fisico.use-case';
import { GetJugadorUseCase } from './application/get-jugador.use-case';
import { GetMiJugadorUseCase } from './application/get-mi-jugador.use-case';
import { GetResumenAtributosUseCase } from './application/get-resumen-atributos.use-case';
import { GetResumenUseCase } from './application/get-resumen.use-case';
import { JugadorAccessService } from './application/jugador-access.service';
import { ListEquiposJugadorUseCase } from './application/list-equipos-jugador.use-case';
import { ListJugadoresUseCase } from './application/list-jugadores.use-case';
import { ListLesionesUseCase } from './application/list-lesiones.use-case';
import { ListPosicionesUseCase } from './application/list-posiciones.use-case';
import { UpdateAtributosUseCase } from './application/update-atributos.use-case';
import { UpdateFisicoUseCase } from './application/update-fisico.use-case';
import { UpdateJugadorUseCase } from './application/update-jugador.use-case';
import { UpdateLesionUseCase } from './application/update-lesion.use-case';
import { UpdatePosicionUseCase } from './application/update-posicion.use-case';
import { UploadFotoUseCase } from './application/upload-foto.use-case';
import { EquiposGateway } from './domain/repositories/equipos.gateway';
import { JugadoresRepository } from './domain/repositories/jugadores.repository';
import { HttpEquiposGateway } from './infrastructure/http-equipos.gateway';
import { SupabaseJugadoresRepository } from './infrastructure/supabase-jugadores.repository';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { SupabaseAuthGuard } from './presentation/guards/supabase-auth.guard';
import { JugadoresController } from './presentation/jugadores.controller';
import { LesionesController } from './presentation/lesiones.controller';

@Module({
  controllers: [JugadoresController, LesionesController],
  providers: [
    // Puertos -> adaptadores (los casos de uso dependen de las interfaces)
    { provide: JugadoresRepository, useClass: SupabaseJugadoresRepository },
    { provide: EquiposGateway, useClass: HttpEquiposGateway },
    JugadorAccessService,
    // Perfil
    CreateJugadorUseCase,
    ListJugadoresUseCase,
    GetJugadorUseCase,
    GetMiJugadorUseCase,
    UpdateJugadorUseCase,
    UploadFotoUseCase,
    // Datos físicos
    GetFisicoUseCase,
    UpdateFisicoUseCase,
    // Posiciones
    ListPosicionesUseCase,
    AddPosicionUseCase,
    UpdatePosicionUseCase,
    DeletePosicionUseCase,
    // Atributos
    GetAtributosUseCase,
    UpdateAtributosUseCase,
    GetResumenAtributosUseCase,
    // Resumen e integración con equipos-ms
    GetResumenUseCase,
    ListEquiposJugadorUseCase,
    // Lesiones
    ListLesionesUseCase,
    CreateLesionUseCase,
    UpdateLesionUseCase,
    DeleteLesionUseCase,
    // Infra transversal
    SupabaseAuthGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class JugadoresModule {}

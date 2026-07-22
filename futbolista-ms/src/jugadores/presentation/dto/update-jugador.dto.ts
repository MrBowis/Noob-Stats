import { PartialType } from '@nestjs/swagger';
import { CreateJugadorDto } from './create-jugador.dto';

/**
 * Todos los campos son opcionales. `userId` no aparece: la propiedad del
 * perfil no es editable, y `equipoId`/estadísticas son de `equipos-ms`.
 */
export class UpdateJugadorDto extends PartialType(CreateJugadorDto) {}

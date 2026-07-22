import { ApiProperty } from '@nestjs/swagger';
import { EquipoMiembroResponseDto } from './miembro-response.dto';

const ESTADOS = ['pendiente', 'aceptada', 'rechazada', 'cancelada'];

export class InvitacionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  equipoId: string;

  @ApiProperty({ description: 'ID (usuario) del jugador invitado.' })
  usuarioId: string;

  @ApiProperty({ enum: ESTADOS })
  estado: string;

  @ApiProperty({ nullable: true })
  mensaje: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ nullable: true })
  respondedAt: string | null;
}

export class InvitacionDetalleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  equipoId: string;

  @ApiProperty()
  equipoNombre: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  jugadorNombres: string;

  @ApiProperty()
  jugadorApellidos: string;

  @ApiProperty()
  jugadorEmail: string;

  @ApiProperty({ enum: ESTADOS })
  estado: string;

  @ApiProperty({ nullable: true })
  mensaje: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ nullable: true })
  respondedAt: string | null;
}

export class ResponderInvitacionResponseDto {
  @ApiProperty({ type: InvitacionResponseDto })
  invitacion: InvitacionResponseDto;

  @ApiProperty({
    type: EquipoMiembroResponseDto,
    nullable: true,
    description: 'Miembro creado si la invitación fue aceptada; null si no.',
  })
  miembro: EquipoMiembroResponseDto | null;
}

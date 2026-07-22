import { ApiProperty } from '@nestjs/swagger';

export class MiembroDetalleResponseDto {
  @ApiProperty({ description: 'ID del registro equipo_miembro.' })
  id: string;

  @ApiProperty({ description: 'ID (usuario) del jugador.' })
  usuarioId: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  dorsal: number | null;

  @ApiProperty({ nullable: true })
  posicion: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Casilla táctica dentro de la formación (null = suplente).',
  })
  slot: string | null;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  joinedAt: string;
}

export class EquipoMiembroResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  equipoId: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty({ nullable: true })
  dorsal: number | null;

  @ApiProperty({ nullable: true })
  posicion: string | null;

  @ApiProperty({ nullable: true })
  slot: string | null;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  joinedAt: string;
}

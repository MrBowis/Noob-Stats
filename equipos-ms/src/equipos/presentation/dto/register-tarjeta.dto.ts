import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import type { TarjetaTipo } from '../../domain/entities/partido.entity';

export class RegisterTarjetaDto {
  @ApiProperty({
    description: 'ID (usuario) del jugador amonestado. Debe ser del equipo.',
  })
  @IsUUID()
  usuarioId: string;

  @ApiProperty({ enum: ['amarilla', 'roja'] })
  @IsIn(['amarilla', 'roja'])
  tipo: TarjetaTipo;

  @ApiPropertyOptional({ example: 67, minimum: 0, maximum: 130 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  minuto?: number;
}

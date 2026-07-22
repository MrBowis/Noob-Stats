import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RegisterGolDto {
  @ApiProperty({
    description: 'ID (usuario) del jugador que anotó. Debe ser del equipo.',
  })
  @IsUUID()
  usuarioId: string;

  @ApiPropertyOptional({ example: 23, minimum: 0, maximum: 130 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  minuto?: number;
}

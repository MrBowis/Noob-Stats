import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { POSICIONES } from '../../domain/catalogos';
import type { Posicion } from '../../domain/catalogos';

export class CreatePosicionDto {
  @ApiProperty({ enum: POSICIONES, example: 'PORTERO' })
  @IsIn(POSICIONES)
  posicion!: Posicion;

  @ApiPropertyOptional({
    description:
      'Marca la posición como principal. Sólo puede haber una; la anterior pasa a secundaria. Por defecto, la primera posición registrada es la principal.',
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}

export class UpdatePosicionDto {
  @ApiPropertyOptional({ enum: POSICIONES })
  @IsOptional()
  @IsIn(POSICIONES)
  posicion?: Posicion;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}

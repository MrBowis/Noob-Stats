import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateFisicoDto {
  @ApiPropertyOptional({ example: 178.5, minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(300)
  alturaCm?: number;

  @ApiPropertyOptional({ example: 72, minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(300)
  pesoKg?: number;
}

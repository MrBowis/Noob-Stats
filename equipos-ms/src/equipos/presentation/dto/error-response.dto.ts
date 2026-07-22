import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'EquipoNotFoundError' })
  error: string;

  @ApiProperty({ example: 'El equipo no existe' })
  message: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class InvitarJugadorDto {
  @ApiProperty({
    example: 'jugador@example.com',
    description: 'Correo del Futbolista al que se invita.',
  })
  @IsEmail()
  jugadorEmail: string;

  @ApiPropertyOptional({ example: 'Únete a nuestro equipo para la temporada.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  mensaje?: string;
}

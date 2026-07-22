import { ApiProperty } from '@nestjs/swagger';
import { RolResponseDto } from './rol-response.dto';

export class PersonaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty({ nullable: true })
  correo: string | null;

  @ApiProperty({ nullable: true })
  fechaNacimiento: string | null;

  @ApiProperty()
  createdAt: string;
}

export class UsuarioDetalleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ example: 'activo' })
  estado: string;

  @ApiProperty({ nullable: true })
  supabaseAuthId: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: PersonaResponseDto })
  persona: PersonaResponseDto;

  @ApiProperty({ type: RolResponseDto })
  rol: RolResponseDto;
}

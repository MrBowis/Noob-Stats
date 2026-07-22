import { ApiProperty } from '@nestjs/swagger';

export class UsuarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  personaId: string;

  @ApiProperty()
  rolId: string;

  @ApiProperty({ nullable: true })
  supabaseAuthId: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  createdAt: string;
}

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

export class RolResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombreRol: string;

  @ApiProperty({ nullable: true })
  descripcion: string | null;
}

export class UserProfileResponseDto {
  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;

  @ApiProperty({ type: PersonaResponseDto })
  persona: PersonaResponseDto;

  @ApiProperty({ type: RolResponseDto })
  rol: RolResponseDto;
}

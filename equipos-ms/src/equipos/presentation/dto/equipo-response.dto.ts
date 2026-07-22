import { ApiProperty } from '@nestjs/swagger';
import { FORMACIONES } from '../../domain/formations';

export class EquipoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ nullable: true })
  descripcion: string | null;

  @ApiProperty({ nullable: true })
  categoria: string | null;

  @ApiProperty({ nullable: true })
  ciudad: string | null;

  @ApiProperty({ nullable: true })
  escudoUrl: string | null;

  @ApiProperty({ enum: FORMACIONES, example: '4-4-2' })
  formacion: string;

  @ApiProperty({ description: 'ID (usuario) del entrenador propietario.' })
  entrenadorId: string;

  @ApiProperty()
  createdAt: string;
}

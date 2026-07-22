import { ApiProperty } from '@nestjs/swagger';

export class RolResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombreRol: string;

  @ApiProperty({ nullable: true })
  descripcion: string | null;
}

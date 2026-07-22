import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ResponderInvitacionDto {
  @ApiProperty({
    example: true,
    description: 'true para aceptar la invitación, false para rechazarla.',
  })
  @IsBoolean()
  aceptar: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class AuthSessionResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ nullable: true })
  expiresAt: number | null;

  @ApiProperty()
  tokenType: string;
}

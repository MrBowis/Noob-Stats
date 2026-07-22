import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token emitido por Supabase Auth.' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

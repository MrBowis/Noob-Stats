import { ApiProperty } from '@nestjs/swagger';
import { AuthSessionResponseDto } from './auth-session-response.dto';
import { UserProfileResponseDto } from './user-profile-response.dto';

export class RegisterResponseDto {
  @ApiProperty({ type: AuthSessionResponseDto, nullable: true })
  session: AuthSessionResponseDto | null;

  @ApiProperty({ type: UserProfileResponseDto })
  profile: UserProfileResponseDto;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthSessionResponseDto })
  session: AuthSessionResponseDto;

  @ApiProperty({ type: UserProfileResponseDto })
  profile: UserProfileResponseDto;
}

export class GoogleCallbackResponseDto {
  @ApiProperty({ type: UserProfileResponseDto })
  profile: UserProfileResponseDto;

  @ApiProperty()
  isNewUser: boolean;
}

export class GoogleAuthUrlResponseDto {
  @ApiProperty()
  url: string;
}

export class ErrorResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  error: string;

  @ApiProperty()
  message: string;
}

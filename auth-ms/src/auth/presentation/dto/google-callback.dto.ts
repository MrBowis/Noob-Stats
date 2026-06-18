import { IsString, MinLength } from 'class-validator';

export class GoogleCallbackDto {
  /** Access token de Supabase obtenido tras el flujo OAuth de Google. */
  @IsString()
  @MinLength(1)
  accessToken: string;
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { GetGoogleAuthUrlUseCase } from '../application/get-google-auth-url.use-case';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import { LoginWithEmailUseCase } from '../application/login-with-email.use-case';
import { LoginWithGoogleUseCase } from '../application/login-with-google.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import { RegisterWithEmailUseCase } from '../application/register-with-email.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerWithEmail: RegisterWithEmailUseCase,
    private readonly loginWithEmail: LoginWithEmailUseCase,
    private readonly loginWithGoogle: LoginWithGoogleUseCase,
    private readonly getGoogleAuthUrl: GetGoogleAuthUrlUseCase,
    private readonly getProfile: GetProfileUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.registerWithEmail.execute({
      email: dto.email,
      password: dto.password,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      fechaNacimiento: dto.fechaNacimiento,
      rolNombre: dto.rolNombre,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.loginWithEmail.execute({
      email: dto.email,
      password: dto.password,
    });
  }

  @Get('google/url')
  async googleUrl(@Query('redirectTo') redirectTo: string) {
    const result = await this.getGoogleAuthUrl.execute({ redirectTo });
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshToken.execute({ refreshToken: dto.refreshToken });
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  googleCallback(@Body() dto: GoogleCallbackDto) {
    return this.loginWithGoogle.execute({ accessToken: dto.accessToken });
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.getProfile.execute({ authId: user.id });
  }
}

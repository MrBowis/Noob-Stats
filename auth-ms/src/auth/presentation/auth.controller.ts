import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { GetGoogleAuthUrlUseCase } from '../application/get-google-auth-url.use-case';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import { LoginWithEmailUseCase } from '../application/login-with-email.use-case';
import { LoginWithGoogleUseCase } from '../application/login-with-google.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import { RegisterWithEmailUseCase } from '../application/register-with-email.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  GoogleAuthUrlResponseDto,
  GoogleCallbackResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerWithEmail: RegisterWithEmailUseCase,
    private readonly loginWithEmail: LoginWithEmailUseCase,
    private readonly loginWithGoogle: LoginWithGoogleUseCase,
    private readonly getGoogleAuthUrl: GetGoogleAuthUrlUseCase,
    private readonly getProfile: GetProfileUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @ApiOperation({
    summary: 'Registrar usuario con email y contraseña',
    description:
      'Crea la cuenta en Supabase Auth y aprovisiona el Usuario/Persona/Rol de dominio.',
  })
  @ApiOkResponse({
    description: 'Usuario registrado correctamente.',
    type: RegisterResponseDto,
  })
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

  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiOkResponse({
    description: 'Sesión y perfil del usuario autenticado.',
    type: LoginResponseDto,
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.loginWithEmail.execute({
      email: dto.email,
      password: dto.password,
    });
  }

  @ApiOperation({
    summary: 'Obtener URL de autenticación de Google',
    description: 'Genera la URL del flujo OAuth de Google para iniciar sesión.',
  })
  @ApiQuery({
    name: 'redirectTo',
    type: String,
    description: 'URL a la que Supabase redirigirá tras completar el login.',
  })
  @ApiOkResponse({
    description: 'URL de autenticación de Google.',
    type: GoogleAuthUrlResponseDto,
  })
  @Get('google/url')
  async googleUrl(@Query('redirectTo') redirectTo: string) {
    const url = await this.getGoogleAuthUrl.execute({ redirectTo });
    return { url };
  }

  @ApiOperation({ summary: 'Refrescar sesión con un refresh token' })
  @ApiOkResponse({
    description: 'Nueva sesión emitida.',
    type: AuthSessionResponseDto,
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshToken.execute({ refreshToken: dto.refreshToken });
  }

  @ApiOperation({
    summary: 'Completar login con Google',
    description:
      'Recibe el access token de Supabase tras el flujo OAuth y aprovisiona el perfil si es la primera vez.',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado con Google.',
    type: GoogleCallbackResponseDto,
  })
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  googleCallback(@Body() dto: GoogleCallbackDto) {
    return this.loginWithGoogle.execute({
      accessToken: dto.accessToken,
      rolNombre: dto.rolNombre,
    });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado.',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.getProfile.execute({ authId: user.id });
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar la información del usuario autenticado',
    description: 'Edita los datos de la persona (nombres, apellidos, etc.).',
  })
  @ApiOkResponse({
    description: 'Perfil actualizado.',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @Patch('me')
  @UseGuards(SupabaseAuthGuard)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute({
      authId: user.id,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      correo: dto.correo,
      fechaNacimiento: dto.fechaNacimiento,
    });
  }
}

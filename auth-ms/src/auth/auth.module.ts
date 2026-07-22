import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GetGoogleAuthUrlUseCase } from './application/get-google-auth-url.use-case';
import { GetProfileUseCase } from './application/get-profile.use-case';
import { LoginWithEmailUseCase } from './application/login-with-email.use-case';
import { LoginWithGoogleUseCase } from './application/login-with-google.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { RegisterWithEmailUseCase } from './application/register-with-email.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { AuthRepository } from './domain/repositories/auth.repository';
import { SupabaseAuthRepository } from './infrastructure/supabase-auth.repository';
import { AuthController } from './presentation/auth.controller';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { SupabaseAuthGuard } from './presentation/guards/supabase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    // Puerto -> adaptador (los casos de uso dependen de la interfaz, no de Supabase)
    { provide: AuthRepository, useClass: SupabaseAuthRepository },
    RegisterWithEmailUseCase,
    LoginWithEmailUseCase,
    LoginWithGoogleUseCase,
    GetGoogleAuthUrlUseCase,
    GetProfileUseCase,
    RefreshTokenUseCase,
    UpdateProfileUseCase,
    SupabaseAuthGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AuthModule {}

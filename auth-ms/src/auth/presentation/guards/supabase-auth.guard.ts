import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { AuthRepository } from '../../domain/repositories/auth.repository';

/**
 * Protege rutas validando el Bearer token contra Supabase Auth a través del
 * AuthRepository. Si es válido, adjunta el AuthUser al request.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authRepository: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autorización');
    }

    const user = await this.authRepository.getUserFromAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    request.user = user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}

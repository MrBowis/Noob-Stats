import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { EquiposRepository } from '../../domain/repositories/equipos.repository';

/**
 * Valida el Bearer token contra Supabase Auth y adjunta el AuthUser a la
 * request. El `id` del AuthUser es el `supabase_auth_id` del usuario.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly repo: EquiposRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autorización');
    }

    const user = await this.repo.getUserFromAccessToken(token);
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

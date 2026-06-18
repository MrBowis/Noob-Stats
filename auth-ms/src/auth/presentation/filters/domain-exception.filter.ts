import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AuthProviderError,
  DomainError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidTokenError,
  ProfileNotFoundError,
  RoleNotFoundError,
} from '../../domain/exceptions/auth.errors';

/**
 * Traduce los errores de dominio (agnósticos de HTTP) a respuestas HTTP.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(exception);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }

  private statusFor(exception: DomainError): number {
    if (
      exception instanceof InvalidCredentialsError ||
      exception instanceof InvalidTokenError
    ) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (exception instanceof EmailAlreadyInUseError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof ProfileNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof RoleNotFoundError) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof AuthProviderError) {
      return HttpStatus.BAD_GATEWAY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

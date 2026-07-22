import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AdminProviderError,
  DomainError,
  EmailAlreadyInUseError,
  NotAdminError,
  RolAlreadyExistsError,
  RolInUseError,
  RolNotFoundError,
  UsuarioNotFoundError,
} from '../../domain/exceptions/admin.errors';

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
    if (exception instanceof NotAdminError) {
      return HttpStatus.FORBIDDEN;
    }
    if (
      exception instanceof RolNotFoundError ||
      exception instanceof UsuarioNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }
    if (
      exception instanceof RolAlreadyExistsError ||
      exception instanceof RolInUseError ||
      exception instanceof EmailAlreadyInUseError
    ) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof AdminProviderError) {
      return HttpStatus.BAD_GATEWAY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

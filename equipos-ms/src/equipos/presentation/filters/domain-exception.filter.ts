import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AlreadyMiembroError,
  DomainError,
  EquipoNotFoundError,
  EquiposProviderError,
  ForbiddenEquipoAccessError,
  GolNotFoundError,
  InvalidPlayerError,
  InvalidSlotError,
  InvitacionAlreadyExistsError,
  InvitacionNotFoundError,
  InvitacionNotPendingError,
  MiembroNotFoundError,
  NotEntrenadorError,
  NotEquipoOwnerError,
  NotInvitacionOwnerError,
  PartidoNotFoundError,
  TarjetaNotFoundError,
  UsuarioNotFoundError,
} from '../../domain/exceptions/equipos.errors';

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
      exception instanceof EquipoNotFoundError ||
      exception instanceof PartidoNotFoundError ||
      exception instanceof InvitacionNotFoundError ||
      exception instanceof UsuarioNotFoundError ||
      exception instanceof MiembroNotFoundError ||
      exception instanceof GolNotFoundError ||
      exception instanceof TarjetaNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }
    if (
      exception instanceof NotEntrenadorError ||
      exception instanceof NotEquipoOwnerError ||
      exception instanceof ForbiddenEquipoAccessError ||
      exception instanceof NotInvitacionOwnerError
    ) {
      return HttpStatus.FORBIDDEN;
    }
    if (
      exception instanceof AlreadyMiembroError ||
      exception instanceof InvitacionAlreadyExistsError ||
      exception instanceof InvitacionNotPendingError
    ) {
      return HttpStatus.CONFLICT;
    }
    if (
      exception instanceof InvalidPlayerError ||
      exception instanceof InvalidSlotError
    ) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof EquiposProviderError) {
      return HttpStatus.BAD_GATEWAY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

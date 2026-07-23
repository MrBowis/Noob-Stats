import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  EquiposGatewayError,
  InvalidFotoError,
  InvalidLesionFechasError,
  JugadorAlreadyExistsError,
  JugadorNotFoundError,
  JugadoresProviderError,
  LesionNotFoundError,
  NotJugadorOwnerError,
  PosicionAlreadyExistsError,
  PosicionNotFoundError,
  UsuarioNotFoundError,
} from '../../domain/exceptions/jugadores.errors';

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
      exception instanceof JugadorNotFoundError ||
      exception instanceof UsuarioNotFoundError ||
      exception instanceof PosicionNotFoundError ||
      exception instanceof LesionNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof NotJugadorOwnerError) {
      return HttpStatus.FORBIDDEN;
    }
    if (
      exception instanceof JugadorAlreadyExistsError ||
      exception instanceof PosicionAlreadyExistsError
    ) {
      return HttpStatus.CONFLICT;
    }
    if (
      exception instanceof InvalidLesionFechasError ||
      exception instanceof InvalidFotoError
    ) {
      return HttpStatus.BAD_REQUEST;
    }
    if (
      exception instanceof JugadoresProviderError ||
      exception instanceof EquiposGatewayError
    ) {
      return HttpStatus.BAD_GATEWAY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

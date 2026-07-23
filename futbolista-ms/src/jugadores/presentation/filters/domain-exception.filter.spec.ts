import { ArgumentsHost, HttpStatus } from '@nestjs/common';
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
import { DomainExceptionFilter } from './domain-exception.filter';

class UnknownDomainError extends DomainError {}

function makeHost(): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  it.each<[DomainError, number]>([
    [new JugadorNotFoundError(), HttpStatus.NOT_FOUND],
    [new UsuarioNotFoundError(), HttpStatus.NOT_FOUND],
    [new PosicionNotFoundError(), HttpStatus.NOT_FOUND],
    [new LesionNotFoundError(), HttpStatus.NOT_FOUND],
    [new NotJugadorOwnerError(), HttpStatus.FORBIDDEN],
    [new JugadorAlreadyExistsError(), HttpStatus.CONFLICT],
    [new PosicionAlreadyExistsError(), HttpStatus.CONFLICT],
    [new InvalidLesionFechasError(), HttpStatus.BAD_REQUEST],
    [new InvalidFotoError(), HttpStatus.BAD_REQUEST],
    [new JugadoresProviderError(), HttpStatus.BAD_GATEWAY],
    [new EquiposGatewayError(), HttpStatus.BAD_GATEWAY],
    [new UnknownDomainError('x'), HttpStatus.INTERNAL_SERVER_ERROR],
  ])('mapea %s al status correcto', (error, expectedStatus) => {
    const { host, status, json } = makeHost();
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: expectedStatus,
        error: error.name,
      }),
    );
  });
});

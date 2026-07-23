import { ArgumentsHost, HttpStatus } from '@nestjs/common';
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
    [new EquipoNotFoundError(), HttpStatus.NOT_FOUND],
    [new PartidoNotFoundError(), HttpStatus.NOT_FOUND],
    [new InvitacionNotFoundError(), HttpStatus.NOT_FOUND],
    [new UsuarioNotFoundError(), HttpStatus.NOT_FOUND],
    [new MiembroNotFoundError(), HttpStatus.NOT_FOUND],
    [new GolNotFoundError(), HttpStatus.NOT_FOUND],
    [new TarjetaNotFoundError(), HttpStatus.NOT_FOUND],
    [new NotEntrenadorError(), HttpStatus.FORBIDDEN],
    [new NotEquipoOwnerError(), HttpStatus.FORBIDDEN],
    [new ForbiddenEquipoAccessError(), HttpStatus.FORBIDDEN],
    [new NotInvitacionOwnerError(), HttpStatus.FORBIDDEN],
    [new AlreadyMiembroError(), HttpStatus.CONFLICT],
    [new InvitacionAlreadyExistsError(), HttpStatus.CONFLICT],
    [new InvitacionNotPendingError(), HttpStatus.CONFLICT],
    [new InvalidPlayerError(), HttpStatus.BAD_REQUEST],
    [new InvalidSlotError(), HttpStatus.BAD_REQUEST],
    [new EquiposProviderError(), HttpStatus.BAD_GATEWAY],
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

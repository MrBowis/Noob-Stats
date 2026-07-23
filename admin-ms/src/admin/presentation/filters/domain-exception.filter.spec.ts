import { ArgumentsHost, HttpStatus } from '@nestjs/common';
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
    [new NotAdminError(), HttpStatus.FORBIDDEN],
    [new RolNotFoundError(), HttpStatus.NOT_FOUND],
    [new UsuarioNotFoundError(), HttpStatus.NOT_FOUND],
    [new RolAlreadyExistsError(), HttpStatus.CONFLICT],
    [new RolInUseError(), HttpStatus.CONFLICT],
    [new EmailAlreadyInUseError(), HttpStatus.CONFLICT],
    [new AdminProviderError(), HttpStatus.BAD_GATEWAY],
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

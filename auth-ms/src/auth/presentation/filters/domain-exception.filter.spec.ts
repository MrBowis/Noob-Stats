import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  AuthProviderError,
  DomainError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidTokenError,
  ProfileNotFoundError,
  RoleNotFoundError,
} from '../../domain/exceptions/auth.errors';
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
    [new InvalidCredentialsError(), HttpStatus.UNAUTHORIZED],
    [new InvalidTokenError(), HttpStatus.UNAUTHORIZED],
    [new EmailAlreadyInUseError(), HttpStatus.CONFLICT],
    [new ProfileNotFoundError(), HttpStatus.NOT_FOUND],
    [new RoleNotFoundError(), HttpStatus.BAD_REQUEST],
    [new AuthProviderError(), HttpStatus.BAD_GATEWAY],
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

/**
 * Errores de dominio del módulo de autenticación. Son agnósticos del
 * transporte (HTTP); la capa de presentación los traduce a códigos de estado.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(message = 'Credenciales inválidas') {
    super(message);
  }
}

export class EmailAlreadyInUseError extends DomainError {
  constructor(message = 'El correo ya está registrado') {
    super(message);
  }
}

export class RoleNotFoundError extends DomainError {
  constructor(message = 'El rol solicitado no existe') {
    super(message);
  }
}

export class ProfileNotFoundError extends DomainError {
  constructor(message = 'No se encontró el perfil del usuario') {
    super(message);
  }
}

export class InvalidTokenError extends DomainError {
  constructor(message = 'Token de sesión inválido o expirado') {
    super(message);
  }
}

export class AuthProviderError extends DomainError {
  constructor(message = 'Error del proveedor de autenticación') {
    super(message);
  }
}

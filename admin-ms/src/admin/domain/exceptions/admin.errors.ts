export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// ---- No encontrado (404) ----
export class RolNotFoundError extends DomainError {
  constructor(message = 'El rol no existe') {
    super(message);
  }
}
export class UsuarioNotFoundError extends DomainError {
  constructor(message = 'El usuario no existe') {
    super(message);
  }
}

// ---- Prohibido (403) ----
export class NotAdminError extends DomainError {
  constructor(message = 'Se requiere el rol de Administrador') {
    super(message);
  }
}

// ---- Conflicto (409) ----
export class RolAlreadyExistsError extends DomainError {
  constructor(message = 'Ya existe un rol con ese nombre') {
    super(message);
  }
}
export class RolInUseError extends DomainError {
  constructor(
    message = 'No se puede eliminar el rol porque tiene usuarios asignados',
  ) {
    super(message);
  }
}
export class EmailAlreadyInUseError extends DomainError {
  constructor(message = 'El correo ya está registrado') {
    super(message);
  }
}

// ---- Proveedor de datos (502) ----
export class AdminProviderError extends DomainError {
  constructor(message = 'Error del proveedor de datos') {
    super(message);
  }
}

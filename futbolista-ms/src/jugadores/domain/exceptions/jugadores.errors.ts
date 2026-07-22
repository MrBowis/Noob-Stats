export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// ---- No encontrado (404) ----
export class JugadorNotFoundError extends DomainError {
  constructor(message = 'El jugador no existe') {
    super(message);
  }
}
export class UsuarioNotFoundError extends DomainError {
  constructor(message = 'No se encontró el usuario') {
    super(message);
  }
}
export class PosicionNotFoundError extends DomainError {
  constructor(message = 'La posición no existe para este jugador') {
    super(message);
  }
}
export class LesionNotFoundError extends DomainError {
  constructor(message = 'La lesión no existe para este jugador') {
    super(message);
  }
}

// ---- Prohibido (403) ----
export class NotJugadorOwnerError extends DomainError {
  constructor(message = 'Sólo el propietario puede modificar este perfil') {
    super(message);
  }
}

// ---- Conflicto (409) ----
export class JugadorAlreadyExistsError extends DomainError {
  constructor(message = 'Este usuario ya tiene un perfil de jugador') {
    super(message);
  }
}
export class PosicionAlreadyExistsError extends DomainError {
  constructor(message = 'El jugador ya tiene registrada esta posición') {
    super(message);
  }
}

// ---- Petición inválida (400) ----
export class InvalidPosicionPrincipalError extends DomainError {
  constructor(message = 'El jugador ya tiene una posición principal') {
    super(message);
  }
}
export class InvalidFotoError extends DomainError {
  constructor(message = 'La foto de perfil no es válida') {
    super(message);
  }
}
export class InvalidLesionFechasError extends DomainError {
  constructor(
    message = 'La fecha de fin no puede ser anterior a la de inicio',
  ) {
    super(message);
  }
}

// ---- Proveedor externo (502) ----
export class JugadoresProviderError extends DomainError {
  constructor(message = 'Error del proveedor de datos') {
    super(message);
  }
}
/** Falla al consultar `equipos-ms`. */
export class EquiposGatewayError extends DomainError {
  constructor(message = 'No se pudo consultar el servicio de equipos') {
    super(message);
  }
}

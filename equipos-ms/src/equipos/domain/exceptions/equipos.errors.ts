export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// ---- No encontrado (404) ----
export class EquipoNotFoundError extends DomainError {
  constructor(message = 'El equipo no existe') {
    super(message);
  }
}
export class PartidoNotFoundError extends DomainError {
  constructor(message = 'El partido no existe') {
    super(message);
  }
}
export class InvitacionNotFoundError extends DomainError {
  constructor(message = 'La invitación no existe') {
    super(message);
  }
}
export class UsuarioNotFoundError extends DomainError {
  constructor(message = 'No se encontró el usuario') {
    super(message);
  }
}
export class MiembroNotFoundError extends DomainError {
  constructor(message = 'El jugador no pertenece a este equipo') {
    super(message);
  }
}
export class GolNotFoundError extends DomainError {
  constructor(message = 'El gol no existe') {
    super(message);
  }
}
export class TarjetaNotFoundError extends DomainError {
  constructor(message = 'La tarjeta no existe') {
    super(message);
  }
}

// ---- Prohibido (403) ----
export class NotEntrenadorError extends DomainError {
  constructor(message = 'Sólo un Entrenador puede realizar esta acción') {
    super(message);
  }
}
export class NotEquipoOwnerError extends DomainError {
  constructor(message = 'No eres el entrenador propietario de este equipo') {
    super(message);
  }
}
export class ForbiddenEquipoAccessError extends DomainError {
  constructor(message = 'No tienes acceso a este equipo') {
    super(message);
  }
}
export class NotInvitacionOwnerError extends DomainError {
  constructor(message = 'Esta invitación no está dirigida a ti') {
    super(message);
  }
}

// ---- Conflicto (409) ----
export class AlreadyMiembroError extends DomainError {
  constructor(message = 'El jugador ya pertenece al equipo') {
    super(message);
  }
}
export class InvitacionAlreadyExistsError extends DomainError {
  constructor(
    message = 'Ya existe una invitación pendiente para este jugador',
  ) {
    super(message);
  }
}
export class InvitacionNotPendingError extends DomainError {
  constructor(message = 'La invitación ya fue respondida') {
    super(message);
  }
}

// ---- Reglas de negocio (400) ----
export class InvalidPlayerError extends DomainError {
  constructor(message = 'El usuario invitado no es un Futbolista') {
    super(message);
  }
}
export class InvalidSlotError extends DomainError {
  constructor(
    message = 'La posición no es válida para la formación del equipo',
  ) {
    super(message);
  }
}

// ---- Proveedor de datos (502) ----
export class EquiposProviderError extends DomainError {
  constructor(message = 'Error del proveedor de datos') {
    super(message);
  }
}

import { Injectable } from '@nestjs/common';
import { Jugador } from '../domain/entities/jugador.entity';
import { InvalidFotoError } from '../domain/exceptions/jugadores.errors';
import {
  FotoPerfil,
  JugadoresRepository,
} from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface UploadFotoInput {
  authId: string;
  jugadorId: string;
  foto: FotoPerfil;
}

/** Tipos aceptados para la foto de perfil. */
export const MIME_IMAGENES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** El bucket `Perfil` está configurado con un límite de 10 MB. */
export const TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Sube la foto del jugador al bucket público y guarda la URL resultante en su
 * perfil. Sólo el propietario puede cambiarla.
 */
@Injectable()
export class UploadFotoUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: UploadFotoInput): Promise<Jugador> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    const { foto } = input;
    if (
      !MIME_IMAGENES.includes(foto.mimeType as (typeof MIME_IMAGENES)[number])
    ) {
      throw new InvalidFotoError(
        'El archivo debe ser una imagen JPG, PNG, WEBP o GIF',
      );
    }
    if (foto.buffer.length === 0) {
      throw new InvalidFotoError('El archivo está vacío');
    }
    if (foto.buffer.length > TAMANIO_MAXIMO_BYTES) {
      throw new InvalidFotoError('La imagen no puede superar los 5 MB');
    }

    const fotoUrl = await this.repo.uploadFotoPerfil(input.jugadorId, foto);
    return this.repo.updateJugador(input.jugadorId, { fotoUrl });
  }
}

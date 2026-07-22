import {
  InvalidFotoError,
  NotJugadorOwnerError,
} from '../domain/exceptions/jugadores.errors';
import {
  AUTH_ID,
  JUGADOR_ID,
  MockJugadoresRepository,
  createMockJugadoresRepository,
  makeJugador,
  makeUsuario,
} from './__mocks__/jugadores-repository.mock';
import { JugadorAccessService } from './jugador-access.service';
import {
  TAMANIO_MAXIMO_BYTES,
  UploadFotoUseCase,
} from './upload-foto.use-case';

describe('UploadFotoUseCase', () => {
  let repo: MockJugadoresRepository;
  let useCase: UploadFotoUseCase;

  const foto = (
    overrides: Partial<
      Parameters<MockJugadoresRepository['uploadFotoPerfil']>[1]
    > = {},
  ) => ({
    buffer: Buffer.from('imagen-falsa'),
    mimeType: 'image/jpeg',
    fileName: 'perfil.jpg',
    ...overrides,
  });

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    useCase = new UploadFotoUseCase(repo, new JugadorAccessService(repo));
    repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
    repo.findJugadorById.mockResolvedValue(makeJugador());
  });

  it('sube la imagen y guarda la URL en el perfil', async () => {
    repo.uploadFotoPerfil.mockResolvedValue('https://cdn/perfil.jpg');
    repo.updateJugador.mockResolvedValue(
      makeJugador({ fotoUrl: 'https://cdn/perfil.jpg' }),
    );

    const jugador = await useCase.execute({
      authId: AUTH_ID,
      jugadorId: JUGADOR_ID,
      foto: foto(),
    });

    expect(repo.uploadFotoPerfil).toHaveBeenCalledWith(JUGADOR_ID, foto());
    expect(repo.updateJugador).toHaveBeenCalledWith(JUGADOR_ID, {
      fotoUrl: 'https://cdn/perfil.jpg',
    });
    expect(jugador.fotoUrl).toBe('https://cdn/perfil.jpg');
  });

  it('rechaza un archivo que no es imagen', async () => {
    await expect(
      useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        foto: foto({ mimeType: 'application/pdf', fileName: 'cv.pdf' }),
      }),
    ).rejects.toBeInstanceOf(InvalidFotoError);
    expect(repo.uploadFotoPerfil).not.toHaveBeenCalled();
  });

  it('rechaza una imagen que supera el tamaño máximo', async () => {
    await expect(
      useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        foto: foto({ buffer: Buffer.alloc(TAMANIO_MAXIMO_BYTES + 1) }),
      }),
    ).rejects.toBeInstanceOf(InvalidFotoError);
    expect(repo.uploadFotoPerfil).not.toHaveBeenCalled();
  });

  it('rechaza un archivo vacío', async () => {
    await expect(
      useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        foto: foto({ buffer: Buffer.alloc(0) }),
      }),
    ).rejects.toBeInstanceOf(InvalidFotoError);
  });

  it('no permite subir la foto de otro jugador', async () => {
    repo.findJugadorById.mockResolvedValue(
      makeJugador({ userId: 'user-9999' }),
    );

    await expect(
      useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        foto: foto(),
      }),
    ).rejects.toBeInstanceOf(NotJugadorOwnerError);
    expect(repo.uploadFotoPerfil).not.toHaveBeenCalled();
  });
});

import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { JugadoresProviderError } from '../domain/exceptions/jugadores.errors';
import { SupabaseJugadoresRepository } from './supabase-jugadores.repository';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

interface Resultado {
  data?: unknown;
  error?: { message: string } | null;
}

class FakeQueryBuilder implements PromiseLike<Resultado> {
  private resultado: Resultado = { data: null, error: null };

  select = jest.fn(() => this);
  insert = jest.fn((values: Record<string, unknown>) => {
    void values;
    return this;
  });
  update = jest.fn((patch: Record<string, unknown>) => {
    void patch;
    return this;
  });
  upsert = jest.fn((values: Record<string, unknown>, opts?: unknown) => {
    void values;
    void opts;
    return this;
  });
  delete = jest.fn(() => this);
  eq = jest.fn(() => this);
  neq = jest.fn(() => this);
  in = jest.fn(() => this);
  order = jest.fn(() => this);

  maybeSingle = jest.fn(() => Promise.resolve(this.resultado));
  single = jest.fn(() => Promise.resolve(this.resultado));
  returns = jest.fn(() => this);

  then<T1 = Resultado, T2 = never>(
    onfulfilled?: ((value: Resultado) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return Promise.resolve(this.resultado).then(onfulfilled, onrejected);
  }

  resuelve(resultado: Resultado): this {
    this.resultado = { data: null, error: null, ...resultado };
    return this;
  }
}

class FakeDbClient {
  private colas = new Map<string, FakeQueryBuilder[]>();
  storage: { from: jest.Mock };

  constructor(
    private readonly storageUpload: Resultado,
    publicUrl: string,
  ) {
    const storageBuilder = {
      upload: jest.fn(() => Promise.resolve(this.storageUpload)),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl } })),
    };
    this.storage = { from: jest.fn(() => storageBuilder) };
  }

  from = jest.fn((tabla: string) => {
    const cola = this.colas.get(tabla);
    if (cola?.length) return cola.shift()!;
    return new FakeQueryBuilder();
  });

  encola(tabla: string, resultado: Resultado): FakeQueryBuilder {
    const builder = new FakeQueryBuilder().resuelve(resultado);
    const cola = this.colas.get(tabla) ?? [];
    cola.push(builder);
    this.colas.set(tabla, cola);
    return builder;
  }
}

const config = {
  getOrThrow: (key: string) => `value-${key}`,
  get: (key: string) =>
    key === 'SUPABASE_STORAGE_BUCKET' ? 'Perfil' : undefined,
} as unknown as ConfigService;

const usuarioRow = {
  id: 'user-0001',
  supabase_auth_id: 'auth-0001',
  email: 'jugador@example.com',
  persona: {
    nombres: 'Diego',
    apellidos: 'Chalá',
    fecha_nacimiento: '2002-05-15',
  },
  rol: { nombre_rol: 'Futbolista' },
};

const jugadorRow = {
  id: 'jugador-0001',
  user_id: 'user-0001',
  genero: 'MASCULINO',
  nacionalidad: 'Ecuatoriana',
  foto_url: null,
  pierna_habil: 'DERECHA',
  estado: 'ACTIVO',
  fecha_creacion: '2026-07-01T00:00:00.000Z',
  fecha_actualizacion: '2026-07-01T00:00:00.000Z',
};

function makeRepo(
  storageUpload: Resultado = { error: null },
  publicUrl = 'https://cdn.example.com/perfil.png',
): {
  repo: SupabaseJugadoresRepository;
  dbClient: FakeDbClient;
  authClient: { auth: { getUser: jest.Mock } };
} {
  const dbClient = new FakeDbClient(storageUpload, publicUrl);
  const authClient = { auth: { getUser: jest.fn() } };
  (createClient as jest.Mock)
    .mockReturnValueOnce(authClient)
    .mockReturnValueOnce(dbClient);
  const repo = new SupabaseJugadoresRepository(config);
  return { repo, dbClient, authClient };
}

describe('SupabaseJugadoresRepository', () => {
  // ---------------- Identidad ----------------

  it('getUserFromAccessToken mapea full_name desde user_metadata', async () => {
    const { repo, authClient } = makeRepo();
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'auth-0001',
          email: 'a@b.com',
          user_metadata: { full_name: 'Diego Chalá' },
        },
      },
      error: null,
    });

    await expect(repo.getUserFromAccessToken('tok')).resolves.toEqual({
      id: 'auth-0001',
      email: 'a@b.com',
      fullName: 'Diego Chalá',
    });
  });

  it('getUserFromAccessToken devuelve null si Supabase Auth rechaza el token', async () => {
    const { repo, authClient } = makeRepo();
    authClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
    await expect(repo.getUserFromAccessToken('tok')).resolves.toBeNull();
  });

  it('findUsuarioByAuthId mapea persona y rol resueltos', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('usuario', { data: usuarioRow });

    await expect(repo.findUsuarioByAuthId('auth-0001')).resolves.toEqual({
      id: 'user-0001',
      supabaseAuthId: 'auth-0001',
      email: 'jugador@example.com',
      rolNombre: 'Futbolista',
      nombres: 'Diego',
      apellidos: 'Chalá',
      fechaNacimiento: '2002-05-15',
    });
  });

  it('findUsuarioByAuthId lanza JugadoresProviderError si Supabase falla', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('usuario', { error: { message: 'boom' } });
    await expect(repo.findUsuarioByAuthId('auth-x')).rejects.toBeInstanceOf(
      JugadoresProviderError,
    );
  });

  it('findUsuariosByIds devuelve [] sin consultar Supabase si la lista está vacía', async () => {
    const { repo, dbClient } = makeRepo();
    await expect(repo.findUsuariosByIds([])).resolves.toEqual([]);
    expect(dbClient.from).not.toHaveBeenCalled();
  });

  it('findUsuariosByIds mapea todas las filas', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('usuario', { data: [usuarioRow] });
    const usuarios = await repo.findUsuariosByIds(['user-0001']);
    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].nombres).toBe('Diego');
  });

  // ---------------- Jugador ----------------

  it('createJugador usa ACTIVO por defecto', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador', { data: jugadorRow });
    await repo.createJugador({ userId: 'user-0001' });
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'ACTIVO' }),
    );
  });

  it('createJugador lanza JugadoresProviderError si falla la inserción', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador', { error: { message: 'boom' } });
    await expect(
      repo.createJugador({ userId: 'user-0001' }),
    ).rejects.toBeInstanceOf(JugadoresProviderError);
  });

  it('findJugadorById devuelve null si no existe', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador', { data: null });
    await expect(repo.findJugadorById('no-existe')).resolves.toBeNull();
  });

  it('findJugadorByUserId mapea la fila', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador', { data: jugadorRow });
    await expect(repo.findJugadorByUserId('user-0001')).resolves.toMatchObject({
      id: 'jugador-0001',
    });
  });

  it('listJugadores sin filtros devuelve todos ordenados', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador', { data: [jugadorRow] });
    const jugadores = await repo.listJugadores({});
    expect(builder.order).toHaveBeenCalledWith('fecha_creacion', {
      ascending: false,
    });
    expect(jugadores).toHaveLength(1);
  });

  it('listJugadores filtra por posición vía jugador_posicion', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador_posicion', {
      data: [{ jugador_id: 'jugador-0001' }],
    });
    const builder = dbClient.encola('jugador', { data: [jugadorRow] });

    await repo.listJugadores({ posicion: 'PORTERO' });

    expect(builder.in).toHaveBeenCalledWith('id', ['jugador-0001']);
  });

  it('listJugadores devuelve [] de inmediato si ningún jugador tiene la posición', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador_posicion', { data: [] });

    await expect(repo.listJugadores({ posicion: 'PORTERO' })).resolves.toEqual(
      [],
    );
  });

  it('listJugadores aplica piernaHabil y estado cuando se indican', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador', { data: [] });
    await repo.listJugadores({ piernaHabil: 'DERECHA', estado: 'ACTIVO' });
    expect(builder.eq).toHaveBeenCalledWith('pierna_habil', 'DERECHA');
    expect(builder.eq).toHaveBeenCalledWith('estado', 'ACTIVO');
  });

  it('updateJugador sólo envía los campos definidos', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador', { data: jugadorRow });
    await repo.updateJugador('jugador-0001', { nacionalidad: 'Chile' });
    const payload = builder.update.mock.calls[0][0];
    expect(payload.nacionalidad).toBe('Chile');
    expect(payload.genero).toBeUndefined();
  });

  // ---------------- Foto de perfil ----------------

  it('uploadFotoPerfil sube el archivo y devuelve la URL pública', async () => {
    const { repo, dbClient } = makeRepo(
      { error: null },
      'https://cdn.example.com/jugadores/jugador-0001/perfil-1.png',
    );

    const url = await repo.uploadFotoPerfil('jugador-0001', {
      buffer: Buffer.from('img'),
      mimeType: 'image/png',
      fileName: 'foto.png',
    });

    expect(url).toBe(
      'https://cdn.example.com/jugadores/jugador-0001/perfil-1.png',
    );
    expect(dbClient.storage.from).toHaveBeenCalledWith('Perfil');
  });

  it('uploadFotoPerfil deduce la extensión del mimeType si el archivo no la trae', async () => {
    const { repo, dbClient } = makeRepo();
    const storageBuilder = dbClient.storage.from('Perfil') as unknown as {
      upload: jest.Mock<Promise<Resultado>, [string, Buffer, unknown]>;
    };

    await repo.uploadFotoPerfil('jugador-0001', {
      buffer: Buffer.from('img'),
      mimeType: 'image/jpeg',
      fileName: 'archivo-sin-extension',
    });

    const ruta = storageBuilder.upload.mock.calls.at(-1)?.[0];
    expect(ruta?.endsWith('.jpg')).toBe(true);
  });

  it('uploadFotoPerfil lanza JugadoresProviderError si Supabase Storage falla', async () => {
    const { repo } = makeRepo({ error: { message: 'sin espacio' } });
    await expect(
      repo.uploadFotoPerfil('jugador-0001', {
        buffer: Buffer.from('img'),
        mimeType: 'image/png',
        fileName: 'foto.png',
      }),
    ).rejects.toBeInstanceOf(JugadoresProviderError);
  });

  // ---------------- Físico ----------------

  it('findFisico convierte altura/peso de string a número', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador_fisico', {
      data: {
        id: 'fisico-1',
        jugador_id: 'jugador-0001',
        altura_cm: '178.50',
        peso_kg: '72.00',
        fecha_actualizacion: '2026-07-01T00:00:00.000Z',
      },
    });

    const fisico = await repo.findFisico('jugador-0001');
    expect(fisico?.alturaCm).toBe(178.5);
    expect(fisico?.pesoKg).toBe(72);
  });

  it('findFisico devuelve alturaCm/pesoKg null si la fila los trae null', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador_fisico', {
      data: {
        id: 'fisico-1',
        jugador_id: 'jugador-0001',
        altura_cm: null,
        peso_kg: null,
        fecha_actualizacion: '2026-07-01T00:00:00.000Z',
      },
    });
    const fisico = await repo.findFisico('jugador-0001');
    expect(fisico?.alturaCm).toBeNull();
    expect(fisico?.pesoKg).toBeNull();
  });

  it('findFisicoByJugadorIds devuelve [] si la lista está vacía', async () => {
    const { repo, dbClient } = makeRepo();
    await expect(repo.findFisicoByJugadorIds([])).resolves.toEqual([]);
    expect(dbClient.from).not.toHaveBeenCalled();
  });

  it('upsertFisico usa onConflict jugador_id', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_fisico', {
      data: {
        id: 'fisico-1',
        jugador_id: 'jugador-0001',
        altura_cm: 180,
        peso_kg: 75,
        fecha_actualizacion: '2026-07-01T00:00:00.000Z',
      },
    });
    await repo.upsertFisico('jugador-0001', { alturaCm: 180 });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ jugador_id: 'jugador-0001' }),
      { onConflict: 'jugador_id' },
    );
  });

  // ---------------- Posiciones ----------------

  it('listPosiciones ordena principal primero', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_posicion', {
      data: [
        {
          id: 'p1',
          jugador_id: 'jugador-0001',
          posicion: 'PORTERO',
          es_principal: true,
        },
      ],
    });
    await repo.listPosiciones('jugador-0001');
    expect(builder.order).toHaveBeenCalledWith('es_principal', {
      ascending: false,
    });
  });

  it('listPosicionesByJugadorIds devuelve [] si la lista está vacía', async () => {
    const { repo } = makeRepo();
    await expect(repo.listPosicionesByJugadorIds([])).resolves.toEqual([]);
  });

  it('createPosicion mapea la fila insertada', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador_posicion', {
      data: {
        id: 'p1',
        jugador_id: 'jugador-0001',
        posicion: 'PORTERO',
        es_principal: true,
      },
    });
    await expect(
      repo.createPosicion({
        jugadorId: 'jugador-0001',
        posicion: 'PORTERO',
        esPrincipal: true,
      }),
    ).resolves.toMatchObject({ posicion: 'PORTERO', esPrincipal: true });
  });

  it('clearPosicionPrincipal excluye el id indicado', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_posicion', { error: null });
    await repo.clearPosicionPrincipal('jugador-0001', 'pos-actual');
    expect(builder.neq).toHaveBeenCalledWith('id', 'pos-actual');
  });

  it('clearPosicionPrincipal no filtra por id si no se indica excepción', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_posicion', { error: null });
    await repo.clearPosicionPrincipal('jugador-0001');
    expect(builder.neq).not.toHaveBeenCalled();
  });

  // ---------------- Atributos ----------------

  it('findAtributosByJugadorIds devuelve [] si la lista está vacía', async () => {
    const { repo } = makeRepo();
    await expect(repo.findAtributosByJugadorIds([])).resolves.toEqual([]);
  });

  it('upsertAtributos guarda los cinco valores', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_atributo', {
      data: {
        id: 'a1',
        jugador_id: 'jugador-0001',
        ataque: 80,
        tactica: 70,
        tecnica: 60,
        defensa: 50,
        creatividad: 90,
        fecha_actualizacion: '2026-07-01T00:00:00.000Z',
      },
    });

    await repo.upsertAtributos('jugador-0001', {
      ataque: 80,
      tactica: 70,
      tecnica: 60,
      defensa: 50,
      creatividad: 90,
    });

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ ataque: 80, creatividad: 90 }),
      { onConflict: 'jugador_id' },
    );
  });

  // ---------------- Lesiones ----------------

  it('listLesiones ordena por fecha de inicio descendente', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_lesion', { data: [] });
    await repo.listLesiones('jugador-0001');
    expect(builder.order).toHaveBeenCalledWith('fecha_inicio', {
      ascending: false,
    });
  });

  it('createLesion usa ACTIVA por defecto', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_lesion', {
      data: {
        id: 'l1',
        jugador_id: 'jugador-0001',
        parte_cuerpo: 'TOBILLO',
        nota: 'Esguince',
        fecha_inicio: '2026-05-15',
        fecha_fin: null,
        estado: 'ACTIVA',
        fecha_creacion: '2026-05-15T00:00:00.000Z',
        fecha_actualizacion: '2026-05-15T00:00:00.000Z',
      },
    });

    await repo.createLesion({
      jugadorId: 'jugador-0001',
      parteCuerpo: 'TOBILLO',
      nota: 'Esguince',
      fechaInicio: '2026-05-15',
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'ACTIVA' }),
    );
  });

  it('updateLesion sólo envía los campos definidos', async () => {
    const { repo, dbClient } = makeRepo();
    const builder = dbClient.encola('jugador_lesion', {
      data: {
        id: 'l1',
        jugador_id: 'jugador-0001',
        parte_cuerpo: 'TOBILLO',
        nota: 'Esguince',
        fecha_inicio: '2026-05-15',
        fecha_fin: '2026-06-01',
        estado: 'RECUPERADA',
        fecha_creacion: '2026-05-15T00:00:00.000Z',
        fecha_actualizacion: '2026-06-01T00:00:00.000Z',
      },
    });

    await repo.updateLesion('l1', {
      estado: 'RECUPERADA',
      fechaFin: '2026-06-01',
    });

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'RECUPERADA',
        fecha_fin: '2026-06-01',
      }),
    );
  });

  it('deleteLesion propaga el error de Supabase', async () => {
    const { repo, dbClient } = makeRepo();
    dbClient.encola('jugador_lesion', { error: { message: 'boom' } });
    await expect(repo.deleteLesion('l1')).rejects.toBeInstanceOf(
      JugadoresProviderError,
    );
  });
});

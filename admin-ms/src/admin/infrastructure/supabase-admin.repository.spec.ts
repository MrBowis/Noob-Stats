import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import {
  AdminProviderError,
  EmailAlreadyInUseError,
  RolAlreadyExistsError,
} from '../domain/exceptions/admin.errors';
import { SupabaseAdminRepository } from './supabase-admin.repository';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

interface Resultado {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
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
  delete = jest.fn(() => this);
  eq = jest.fn(() => this);
  not = jest.fn(() => this);
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
} as unknown as ConfigService;

const rolRow = { id: 'rol-0001', nombre_rol: 'Futbolista', descripcion: null };

const personaRow = {
  id: 'per-0001',
  nombres: 'Diego',
  apellidos: 'Chalá',
  correo: 'diego@example.com',
  fecha_nacimiento: null,
  created_at: '2026-07-01T00:00:00.000Z',
};

const usuarioRow = {
  id: 'user-0001',
  persona_id: 'per-0001',
  rol_id: 'rol-0001',
  supabase_auth_id: 'auth-0001',
  email: 'diego@example.com',
  estado: 'activo',
  created_at: '2026-07-01T00:00:00.000Z',
};

describe('SupabaseAdminRepository', () => {
  let dbClient: FakeDbClient;
  let authClient: { auth: { getUser: jest.Mock } };
  let repo: SupabaseAdminRepository;

  beforeEach(() => {
    dbClient = new FakeDbClient();
    authClient = { auth: { getUser: jest.fn() } };
    (createClient as jest.Mock)
      .mockReturnValueOnce(authClient)
      .mockReturnValueOnce(dbClient);
    repo = new SupabaseAdminRepository(config);
  });

  // ---------------- Identidad ----------------

  it('getUserFromAccessToken mapea el usuario de Supabase Auth', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'auth-0001',
          email: 'a@b.com',
          user_metadata: { name: 'Diego' },
        },
      },
      error: null,
    });

    await expect(repo.getUserFromAccessToken('tok')).resolves.toEqual({
      id: 'auth-0001',
      email: 'a@b.com',
      fullName: 'Diego',
    });
  });

  it('getUserFromAccessToken devuelve null si Supabase Auth rechaza el token', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
    await expect(repo.getUserFromAccessToken('tok')).resolves.toBeNull();
  });

  it('findUsuarioDetalleByAuthId mapea persona y rol resueltos', async () => {
    dbClient.encola('usuario', {
      data: { ...usuarioRow, persona: personaRow, rol: rolRow },
    });

    await expect(
      repo.findUsuarioDetalleByAuthId('auth-0001'),
    ).resolves.toMatchObject({
      id: 'user-0001',
      persona: { nombres: 'Diego' },
      rol: { nombreRol: 'Futbolista' },
    });
  });

  it('findUsuarioDetalleByAuthId lanza AdminProviderError si falla', async () => {
    dbClient.encola('usuario', { error: { message: 'boom' } });
    await expect(
      repo.findUsuarioDetalleByAuthId('auth-x'),
    ).rejects.toBeInstanceOf(AdminProviderError);
  });

  // ---------------- Roles ----------------

  it('createRol mapea la fila insertada', async () => {
    dbClient.encola('rol', { data: rolRow });
    await expect(repo.createRol({ nombreRol: 'Futbolista' })).resolves.toEqual({
      id: 'rol-0001',
      nombreRol: 'Futbolista',
      descripcion: null,
    });
  });

  it('createRol lanza RolAlreadyExistsError ante una violación de unicidad', async () => {
    dbClient.encola('rol', {
      error: { message: 'duplicate', code: '23505' },
    });
    await expect(
      repo.createRol({ nombreRol: 'Futbolista' }),
    ).rejects.toBeInstanceOf(RolAlreadyExistsError);
  });

  it('createRol lanza AdminProviderError ante otros errores', async () => {
    dbClient.encola('rol', { error: { message: 'boom', code: 'otro' } });
    await expect(
      repo.createRol({ nombreRol: 'Futbolista' }),
    ).rejects.toBeInstanceOf(AdminProviderError);
  });

  it('listRoles mapea todas las filas', async () => {
    dbClient.encola('rol', { data: [rolRow] });
    await expect(repo.listRoles()).resolves.toEqual([
      { id: 'rol-0001', nombreRol: 'Futbolista', descripcion: null },
    ]);
  });

  it('findRolById devuelve null si no existe', async () => {
    dbClient.encola('rol', { data: null });
    await expect(repo.findRolById('no-existe')).resolves.toBeNull();
  });

  it('findRolByNombre mapea la fila', async () => {
    dbClient.encola('rol', { data: rolRow });
    await expect(repo.findRolByNombre('Futbolista')).resolves.toMatchObject({
      id: 'rol-0001',
    });
  });

  it('updateRol sólo envía los campos definidos', async () => {
    const builder = dbClient.encola('rol', { data: rolRow });
    await repo.updateRol('rol-0001', { nombreRol: 'Editado' });
    expect(builder.update).toHaveBeenCalledWith({ nombre_rol: 'Editado' });
  });

  it('updateRol lanza RolAlreadyExistsError ante una violación de unicidad', async () => {
    dbClient.encola('rol', { error: { message: 'dup', code: '23505' } });
    await expect(
      repo.updateRol('rol-0001', { nombreRol: 'Duplicado' }),
    ).rejects.toBeInstanceOf(RolAlreadyExistsError);
  });

  it('deleteRol propaga el error de Supabase', async () => {
    dbClient.encola('rol', { error: { message: 'boom' } });
    await expect(repo.deleteRol('rol-0001')).rejects.toBeInstanceOf(
      AdminProviderError,
    );
  });

  it('countUsuariosByRol devuelve 0 si count es null', async () => {
    dbClient.encola('usuario', { count: null });
    await expect(repo.countUsuariosByRol('rol-0001')).resolves.toBe(0);
  });

  // ---------------- Usuarios ----------------

  it('createPersona mapea la fila insertada', async () => {
    dbClient.encola('persona', { data: personaRow });
    await expect(
      repo.createPersona({ nombres: 'Diego', apellidos: 'Chalá' }),
    ).resolves.toMatchObject({ nombres: 'Diego' });
  });

  it('createUsuario mapea la fila insertada', async () => {
    dbClient.encola('usuario', { data: usuarioRow });
    await expect(
      repo.createUsuario({
        personaId: 'per-0001',
        rolId: 'rol-0001',
        email: 'diego@example.com',
      }),
    ).resolves.toMatchObject({ id: 'user-0001' });
  });

  it('createUsuario lanza EmailAlreadyInUseError ante una violación de unicidad', async () => {
    dbClient.encola('usuario', {
      error: { message: 'dup', code: '23505' },
    });
    await expect(
      repo.createUsuario({
        personaId: 'per-0001',
        rolId: 'rol-0001',
        email: 'diego@example.com',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('listUsuarios filtra por estado cuando se indica', async () => {
    const builder = dbClient.encola('usuario', {
      data: [{ ...usuarioRow, persona: personaRow, rol: rolRow }],
    });
    await repo.listUsuarios('activo');
    expect(builder.eq).toHaveBeenCalledWith('estado', 'activo');
  });

  it('listUsuarios no filtra si no se indica estado', async () => {
    const builder = dbClient.encola('usuario', { data: [] });
    await repo.listUsuarios();
    expect(builder.eq).not.toHaveBeenCalled();
  });

  it('findUsuarioById devuelve null si no existe', async () => {
    dbClient.encola('usuario', { data: null });
    await expect(repo.findUsuarioById('no-existe')).resolves.toBeNull();
  });

  it('findUsuarioDetalleById mapea persona y rol', async () => {
    dbClient.encola('usuario', {
      data: { ...usuarioRow, persona: personaRow, rol: rolRow },
    });
    await expect(
      repo.findUsuarioDetalleById('user-0001'),
    ).resolves.toMatchObject({ persona: { apellidos: 'Chalá' } });
  });

  it('findUsuarioByEmail devuelve null si no existe', async () => {
    dbClient.encola('usuario', { data: null });
    await expect(
      repo.findUsuarioByEmail('nadie@example.com'),
    ).resolves.toBeNull();
  });

  it('updatePersona sólo envía los campos definidos, incluido null explícito', async () => {
    const builder = dbClient.encola('persona', { data: personaRow });
    await repo.updatePersona('per-0001', { correo: null });
    expect(builder.update).toHaveBeenCalledWith({ correo: null });
  });

  it('updateUsuario sólo envía los campos definidos', async () => {
    const builder = dbClient.encola('usuario', { data: usuarioRow });
    await repo.updateUsuario('user-0001', { estado: 'inactivo' });
    expect(builder.update).toHaveBeenCalledWith({ estado: 'inactivo' });
  });

  // ---------------- Estadísticas ----------------

  it('countUsuarios filtra por estado cuando se indica', async () => {
    const builder = dbClient.encola('usuario', { count: 3 });
    await expect(repo.countUsuarios('activo')).resolves.toBe(3);
    expect(builder.eq).toHaveBeenCalledWith('estado', 'activo');
  });

  it('countUsuarios cuenta todos si no se indica estado', async () => {
    const builder = dbClient.encola('usuario', { count: 7 });
    await expect(repo.countUsuarios()).resolves.toBe(7);
    expect(builder.eq).not.toHaveBeenCalled();
  });

  it('countEquipos devuelve el conteo', async () => {
    dbClient.encola('equipo', { count: 4 });
    await expect(repo.countEquipos()).resolves.toBe(4);
  });

  it('listEquiposResumen mapea id y nombre', async () => {
    dbClient.encola('equipo', {
      data: [{ id: 'eq-1', nombre: 'Noob FC' }],
    });
    await expect(repo.listEquiposResumen()).resolves.toEqual([
      { id: 'eq-1', nombre: 'Noob FC' },
    ]);
  });

  it('listPartidosFinalizados mapea equipoId/golesFavor/golesContra', async () => {
    const builder = dbClient.encola('partido', {
      data: [{ equipo_id: 'eq-1', goles_favor: 2, goles_contra: 1 }],
    });
    const partidos = await repo.listPartidosFinalizados();
    expect(builder.eq).toHaveBeenCalledWith('estado', 'finalizado');
    expect(builder.not).toHaveBeenCalledTimes(2);
    expect(partidos).toEqual([
      { equipoId: 'eq-1', golesFavor: 2, golesContra: 1 },
    ]);
  });

  it('propaga AdminProviderError si Supabase falla en las estadísticas', async () => {
    dbClient.encola('equipo', { error: { message: 'boom' } });
    await expect(repo.countEquipos()).rejects.toBeInstanceOf(
      AdminProviderError,
    );
  });
});

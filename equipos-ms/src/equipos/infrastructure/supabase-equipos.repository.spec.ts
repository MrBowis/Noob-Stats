import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { EquiposProviderError } from '../domain/exceptions/equipos.errors';
import { SupabaseEquiposRepository } from './supabase-equipos.repository';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

interface Resultado {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
}

/**
 * Constructor de consultas encadenables (select/insert/.../eq/.../single) que
 * resuelve al `Resultado` configurado. Además de `single`/`maybeSingle`, el
 * builder es "then-able" para soportar los `await query` sin terminal
 * (usado por las consultas que devuelven listas).
 */
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
  neq = jest.fn(() => this);
  in = jest.fn(() => this);
  gte = jest.fn(() => this);
  order = jest.fn(() => this);

  maybeSingle = jest.fn(() => Promise.resolve(this.resultado));
  single = jest.fn(() => Promise.resolve(this.resultado));

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

/** Cliente Supabase falso: `from(tabla)` entrega builders en cola (FIFO) por tabla. */
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

const usuarioRow = {
  id: 'user-0001',
  persona_id: 'per-0001',
  rol_id: 'rol-0001',
  supabase_auth_id: 'auth-0001',
  email: 'jugador@example.com',
  estado: 'activo',
  persona: { nombres: 'Diego', apellidos: 'Chalá' },
  rol: { nombre_rol: 'Futbolista' },
};

const equipoRow = {
  id: 'equipo-0001',
  nombre: 'Noob FC',
  descripcion: null,
  categoria: null,
  ciudad: null,
  escudo_url: null,
  formacion: '4-4-2',
  entrenador_id: 'user-entrenador',
  created_at: '2026-07-01T00:00:00.000Z',
};

const miembroRow = {
  id: 'miembro-0001',
  equipo_id: 'equipo-0001',
  usuario_id: 'user-0001',
  dorsal: 9,
  posicion: 'Delantero',
  slot: null,
  estado: 'activo',
  joined_at: '2026-07-01T00:00:00.000Z',
};

const invitacionRow = {
  id: 'invitacion-0001',
  equipo_id: 'equipo-0001',
  usuario_id: 'user-0001',
  estado: 'pendiente',
  mensaje: null,
  created_at: '2026-07-01T00:00:00.000Z',
  responded_at: null,
};

const partidoRow = {
  id: 'partido-0001',
  equipo_id: 'equipo-0001',
  rival: 'Rival FC',
  fecha: '2026-08-15T18:00:00.000Z',
  ubicacion: null,
  es_local: true,
  estado: 'programado',
  goles_favor: null,
  goles_contra: null,
  notas: null,
  created_at: '2026-07-01T00:00:00.000Z',
};

describe('SupabaseEquiposRepository', () => {
  let dbClient: FakeDbClient;
  let authClient: { auth: { getUser: jest.Mock } };
  let repo: SupabaseEquiposRepository;

  beforeEach(() => {
    dbClient = new FakeDbClient();
    authClient = { auth: { getUser: jest.fn() } };
    // authClient y dbClient se crean con dos createClient() sucesivos.
    (createClient as jest.Mock)
      .mockReturnValueOnce(authClient)
      .mockReturnValueOnce(dbClient);
    repo = new SupabaseEquiposRepository(config);
  });

  // ---------------- Identidad ----------------

  describe('getUserFromAccessToken', () => {
    it('mapea el usuario de Supabase Auth', async () => {
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

    it('devuelve null si Supabase Auth rechaza el token', async () => {
      authClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid' },
      });

      await expect(repo.getUserFromAccessToken('tok')).resolves.toBeNull();
    });
  });

  it('findUsuarioByAuthId mapea la fila con persona y rol resueltos', async () => {
    dbClient.encola('usuario', { data: usuarioRow });

    await expect(repo.findUsuarioByAuthId('auth-0001')).resolves.toEqual({
      id: 'user-0001',
      personaId: 'per-0001',
      rolId: 'rol-0001',
      rolNombre: 'Futbolista',
      supabaseAuthId: 'auth-0001',
      email: 'jugador@example.com',
      nombres: 'Diego',
      apellidos: 'Chalá',
      estado: 'activo',
    });
  });

  it('findUsuarioByAuthId devuelve null si no hay fila', async () => {
    dbClient.encola('usuario', { data: null });
    await expect(repo.findUsuarioByAuthId('auth-x')).resolves.toBeNull();
  });

  it('findUsuarioByAuthId lanza EquiposProviderError si Supabase falla', async () => {
    dbClient.encola('usuario', { error: { message: 'boom' } });
    await expect(repo.findUsuarioByAuthId('auth-x')).rejects.toBeInstanceOf(
      EquiposProviderError,
    );
  });

  it('findUsuarioByEmail mapea la fila', async () => {
    dbClient.encola('usuario', { data: usuarioRow });
    await expect(
      repo.findUsuarioByEmail('jugador@example.com'),
    ).resolves.toMatchObject({ email: 'jugador@example.com' });
  });

  // ---------------- Equipo ----------------

  it('createEquipo mapea la fila insertada', async () => {
    dbClient.encola('equipo', { data: equipoRow });

    const equipo = await repo.createEquipo({
      nombre: 'Noob FC',
      entrenadorId: 'user-entrenador',
    });

    expect(equipo).toEqual({
      id: 'equipo-0001',
      nombre: 'Noob FC',
      descripcion: null,
      categoria: null,
      ciudad: null,
      escudoUrl: null,
      formacion: '4-4-2',
      entrenadorId: 'user-entrenador',
      createdAt: '2026-07-01T00:00:00.000Z',
    });
  });

  it('createEquipo lanza EquiposProviderError si falla la inserción', async () => {
    dbClient.encola('equipo', { data: null, error: { message: 'boom' } });
    await expect(
      repo.createEquipo({ nombre: 'x', entrenadorId: 'y' }),
    ).rejects.toBeInstanceOf(EquiposProviderError);
  });

  it('findEquipoById devuelve null si no existe', async () => {
    dbClient.encola('equipo', { data: null });
    await expect(repo.findEquipoById('no-existe')).resolves.toBeNull();
  });

  it('listEquiposByUsuario combina equipos propios y de membresía, sin duplicar', async () => {
    dbClient.encola('equipo', { data: [equipoRow] }); // como entrenador
    dbClient.encola('equipo_miembro', { data: [{ equipo_id: 'equipo-0002' }] });
    dbClient.encola('equipo', {
      data: [
        {
          ...equipoRow,
          id: 'equipo-0002',
          created_at: '2026-07-02T00:00:00.000Z',
        },
      ],
    }); // equipos donde es miembro

    const equipos = await repo.listEquiposByUsuario('user-entrenador');

    expect(equipos.map((e) => e.id).sort()).toEqual([
      'equipo-0001',
      'equipo-0002',
    ]);
    // orden descendente por createdAt
    expect(equipos[0].id).toBe('equipo-0002');
  });

  it('listEquiposByUsuario no repite un equipo si ya es entrenador y también aparece como membresía', async () => {
    dbClient.encola('equipo', { data: [equipoRow] });
    dbClient.encola('equipo_miembro', { data: [{ equipo_id: 'equipo-0001' }] });
    // No debería consultar 'equipo' una tercera vez porque memberIds queda vacío.

    const equipos = await repo.listEquiposByUsuario('user-entrenador');

    expect(equipos).toHaveLength(1);
  });

  it('updateEquipo sólo envía los campos definidos', async () => {
    const builder = dbClient.encola('equipo', { data: equipoRow });
    await repo.updateEquipo('equipo-0001', { nombre: 'Otro nombre' });
    expect(builder.update).toHaveBeenCalledWith({ nombre: 'Otro nombre' });
  });

  it('deleteEquipo propaga el error de Supabase', async () => {
    dbClient.encola('equipo', { error: { message: 'boom' } });
    await expect(repo.deleteEquipo('equipo-0001')).rejects.toBeInstanceOf(
      EquiposProviderError,
    );
  });

  // ---------------- Miembros ----------------

  it('findMiembro mapea la fila', async () => {
    dbClient.encola('equipo_miembro', { data: miembroRow });
    await expect(
      repo.findMiembro('equipo-0001', 'user-0001'),
    ).resolves.toMatchObject({ id: 'miembro-0001', dorsal: 9 });
  });

  it('listMiembros mapea nombres/apellidos/email desde el join', async () => {
    dbClient.encola('equipo_miembro', {
      data: [
        {
          ...miembroRow,
          usuario: {
            email: 'jugador@example.com',
            persona: { nombres: 'Diego', apellidos: 'Chalá' },
          },
        },
      ],
    });

    const miembros = await repo.listMiembros('equipo-0001');

    expect(miembros[0]).toMatchObject({
      nombres: 'Diego',
      apellidos: 'Chalá',
      email: 'jugador@example.com',
    });
  });

  it('countMiembros devuelve 0 si count es null', async () => {
    dbClient.encola('equipo_miembro', { count: null });
    await expect(repo.countMiembros('equipo-0001')).resolves.toBe(0);
  });

  it('countMiembros devuelve el conteo', async () => {
    dbClient.encola('equipo_miembro', { count: 5 });
    await expect(repo.countMiembros('equipo-0001')).resolves.toBe(5);
  });

  it('addMiembro mapea la fila insertada', async () => {
    dbClient.encola('equipo_miembro', { data: miembroRow });
    await expect(
      repo.addMiembro({ equipoId: 'equipo-0001', usuarioId: 'user-0001' }),
    ).resolves.toMatchObject({ id: 'miembro-0001' });
  });

  it('updateMiembro sólo aplica los campos definidos, incluido null explícito', async () => {
    const builder = dbClient.encola('equipo_miembro', { data: miembroRow });
    await repo.updateMiembro('equipo-0001', 'user-0001', { slot: null });
    expect(builder.update).toHaveBeenCalledWith({ slot: null });
  });

  it('clearSlot libera la casilla excepto para el usuario indicado', async () => {
    const builder = dbClient.encola('equipo_miembro', { error: null });
    await repo.clearSlot('equipo-0001', 'DCL', 'user-0001');
    expect(builder.update).toHaveBeenCalledWith({ slot: null });
    expect(builder.neq).toHaveBeenCalledWith('usuario_id', 'user-0001');
  });

  it('removeMiembro propaga el error de Supabase', async () => {
    dbClient.encola('equipo_miembro', { error: { message: 'boom' } });
    await expect(
      repo.removeMiembro('equipo-0001', 'user-0001'),
    ).rejects.toBeInstanceOf(EquiposProviderError);
  });

  // ---------------- Invitaciones ----------------

  it('createInvitacion mapea la fila insertada', async () => {
    dbClient.encola('invitacion', { data: invitacionRow });
    await expect(
      repo.createInvitacion({
        equipoId: 'equipo-0001',
        usuarioId: 'user-0001',
      }),
    ).resolves.toMatchObject({ id: 'invitacion-0001', estado: 'pendiente' });
  });

  it('findInvitacionPendiente devuelve null si no hay ninguna', async () => {
    dbClient.encola('invitacion', { data: null });
    await expect(
      repo.findInvitacionPendiente('equipo-0001', 'user-0001'),
    ).resolves.toBeNull();
  });

  it('listInvitacionesByEquipo mapea el detalle con equipo y jugador resueltos', async () => {
    dbClient.encola('invitacion', {
      data: [
        {
          ...invitacionRow,
          equipo: { nombre: 'Noob FC' },
          usuario: {
            email: 'jugador@example.com',
            persona: { nombres: 'Diego', apellidos: 'Chalá' },
          },
        },
      ],
    });

    const invitaciones = await repo.listInvitacionesByEquipo('equipo-0001');

    expect(invitaciones[0]).toMatchObject({
      equipoNombre: 'Noob FC',
      jugadorNombres: 'Diego',
      jugadorApellidos: 'Chalá',
      jugadorEmail: 'jugador@example.com',
    });
  });

  it('listInvitacionesByUsuario aplica el filtro de pendientes cuando se pide', async () => {
    const builder = dbClient.encola('invitacion', { data: [] });
    await repo.listInvitacionesByUsuario('user-0001', true);
    expect(builder.eq).toHaveBeenCalledWith('estado', 'pendiente');
  });

  it('listInvitacionesByUsuario no filtra por estado si no se pide', async () => {
    const builder = dbClient.encola('invitacion', { data: [] });
    await repo.listInvitacionesByUsuario('user-0001', false);
    expect(builder.eq).not.toHaveBeenCalledWith('estado', 'pendiente');
  });

  it('updateInvitacionEstado marca responded_at salvo que vuelva a pendiente', async () => {
    const builder = dbClient.encola('invitacion', {
      data: { ...invitacionRow, estado: 'aceptada' },
    });
    await repo.updateInvitacionEstado('invitacion-0001', 'aceptada');
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'aceptada' }),
    );
    const patch = builder.update.mock.calls[0][0];
    expect(patch.responded_at).not.toBeNull();
  });

  // ---------------- Partidos ----------------

  it('createPartido usa esLocal=true por defecto', async () => {
    const builder = dbClient.encola('partido', { data: partidoRow });
    await repo.createPartido({
      equipoId: 'equipo-0001',
      rival: 'Rival FC',
      fecha: '2026-08-15T18:00:00.000Z',
    });
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ es_local: true }),
    );
  });

  it('listPartidosByEquipo filtra "proximos" por estado programado y fecha futura', async () => {
    const builder = dbClient.encola('partido', { data: [] });
    await repo.listPartidosByEquipo('equipo-0001', 'proximos');
    expect(builder.eq).toHaveBeenCalledWith('estado', 'programado');
    expect(builder.gte).toHaveBeenCalled();
  });

  it('listPartidosByEquipo filtra "anteriores" por estado finalizado', async () => {
    const builder = dbClient.encola('partido', { data: [] });
    await repo.listPartidosByEquipo('equipo-0001', 'anteriores');
    expect(builder.eq).toHaveBeenCalledWith('estado', 'finalizado');
  });

  it('listPartidosByEquipo "todos" no filtra por estado', async () => {
    const builder = dbClient.encola('partido', { data: [] });
    await repo.listPartidosByEquipo('equipo-0001', 'todos');
    expect(builder.eq).toHaveBeenCalledWith('equipo_id', 'equipo-0001');
    expect(builder.eq).not.toHaveBeenCalledWith('estado', expect.anything());
  });

  it('updatePartido sólo aplica los campos definidos', async () => {
    const builder = dbClient.encola('partido', {
      data: {
        ...partidoRow,
        estado: 'finalizado',
        goles_favor: 2,
        goles_contra: 1,
      },
    });
    await repo.updatePartido('partido-0001', {
      estado: 'finalizado',
      golesFavor: 2,
      golesContra: 1,
    });
    expect(builder.update).toHaveBeenCalledWith({
      estado: 'finalizado',
      goles_favor: 2,
      goles_contra: 1,
    });
  });

  it('findPartidoDetalleById devuelve null si el partido no existe', async () => {
    dbClient.encola('partido', { data: null });
    await expect(repo.findPartidoDetalleById('no-existe')).resolves.toBeNull();
  });

  it('findPartidoDetalleById combina el partido con sus goles y tarjetas', async () => {
    dbClient.encola('partido', { data: partidoRow });
    dbClient.encola('partido_gol', {
      data: [
        {
          id: 'gol-0001',
          partido_id: 'partido-0001',
          usuario_id: 'user-0001',
          minuto: 23,
          usuario: { persona: { nombres: 'Diego', apellidos: 'Chalá' } },
        },
      ],
    });
    dbClient.encola('partido_tarjeta', {
      data: [
        {
          id: 'tarjeta-0001',
          partido_id: 'partido-0001',
          usuario_id: null,
          tipo: 'amarilla',
          minuto: 67,
          usuario: null,
        },
      ],
    });

    const detalle = await repo.findPartidoDetalleById('partido-0001');

    expect(detalle?.goles).toEqual([
      {
        id: 'gol-0001',
        partidoId: 'partido-0001',
        usuarioId: 'user-0001',
        jugadorNombres: 'Diego',
        jugadorApellidos: 'Chalá',
        minuto: 23,
      },
    ]);
    expect(detalle?.tarjetas).toEqual([
      {
        id: 'tarjeta-0001',
        partidoId: 'partido-0001',
        usuarioId: null,
        jugadorNombres: null,
        jugadorApellidos: null,
        tipo: 'amarilla',
        minuto: 67,
      },
    ]);
  });

  it('findPartidoDetalleById lanza EquiposProviderError si fallan los goles', async () => {
    dbClient.encola('partido', { data: partidoRow });
    dbClient.encola('partido_gol', { error: { message: 'boom' } });
    dbClient.encola('partido_tarjeta', { data: [] });

    await expect(
      repo.findPartidoDetalleById('partido-0001'),
    ).rejects.toBeInstanceOf(EquiposProviderError);
  });

  // ---------------- Goles y tarjetas ----------------

  it('addGol usa null por defecto para usuario y minuto', async () => {
    const builder = dbClient.encola('partido_gol', {
      data: {
        id: 'gol-0001',
        partido_id: 'partido-0001',
        usuario_id: null,
        minuto: null,
        usuario: null,
      },
    });
    await repo.addGol({ partidoId: 'partido-0001' });
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ usuario_id: null, minuto: null }),
    );
  });

  it('findGolById devuelve null si no existe', async () => {
    dbClient.encola('partido_gol', { data: null });
    await expect(repo.findGolById('no-existe')).resolves.toBeNull();
  });

  it('deleteGol propaga el error de Supabase', async () => {
    dbClient.encola('partido_gol', { error: { message: 'boom' } });
    await expect(repo.deleteGol('gol-0001')).rejects.toBeInstanceOf(
      EquiposProviderError,
    );
  });

  it('addTarjeta mapea la fila insertada', async () => {
    dbClient.encola('partido_tarjeta', {
      data: {
        id: 'tarjeta-0001',
        partido_id: 'partido-0001',
        usuario_id: 'user-0001',
        tipo: 'roja',
        minuto: 90,
        usuario: { persona: { nombres: 'Diego', apellidos: 'Chalá' } },
      },
    });

    const tarjeta = await repo.addTarjeta({
      partidoId: 'partido-0001',
      usuarioId: 'user-0001',
      tipo: 'roja',
      minuto: 90,
    });

    expect(tarjeta).toMatchObject({
      tipo: 'roja',
      jugadorNombres: 'Diego',
      jugadorApellidos: 'Chalá',
    });
  });

  it('findTarjetaById devuelve null si no existe', async () => {
    dbClient.encola('partido_tarjeta', { data: null });
    await expect(repo.findTarjetaById('no-existe')).resolves.toBeNull();
  });

  it('deleteTarjeta propaga el error de Supabase', async () => {
    dbClient.encola('partido_tarjeta', { error: { message: 'boom' } });
    await expect(repo.deleteTarjeta('tarjeta-0001')).rejects.toBeInstanceOf(
      EquiposProviderError,
    );
  });
});

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthUser } from '../domain/entities/auth-user.entity';
import {
  EquipoMiembro,
  MiembroDetalle,
} from '../domain/entities/equipo-miembro.entity';
import { Equipo } from '../domain/entities/equipo.entity';
import {
  Invitacion,
  InvitacionDetalle,
  InvitacionEstado,
} from '../domain/entities/invitacion.entity';
import {
  Gol,
  Partido,
  PartidoDetalle,
  Tarjeta,
  TarjetaTipo,
} from '../domain/entities/partido.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import { EquiposProviderError } from '../domain/exceptions/equipos.errors';
import { Formacion } from '../domain/formations';
import {
  AddMiembroData,
  CreateEquipoData,
  CreateInvitacionData,
  CreatePartidoData,
  EquiposRepository,
  PartidoFiltro,
  RegisterGolData,
  RegisterTarjetaData,
  UpdateEquipoData,
  UpdateMiembroData,
  UpdatePartidoData,
} from '../domain/repositories/equipos.repository';

interface PersonaRow {
  nombres: string;
  apellidos: string;
}

interface UsuarioJoinRow {
  id: string;
  persona_id: string;
  rol_id: string;
  supabase_auth_id: string | null;
  email: string;
  estado: string;
  persona: PersonaRow;
  rol: { nombre_rol: string };
}

interface EquipoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  ciudad: string | null;
  escudo_url: string | null;
  formacion: Formacion;
  entrenador_id: string;
  created_at: string;
}

interface MiembroRow {
  id: string;
  equipo_id: string;
  usuario_id: string;
  dorsal: number | null;
  posicion: string | null;
  slot: string | null;
  estado: string;
  joined_at: string;
}

interface MiembroJoinRow extends MiembroRow {
  usuario: { email: string; persona: PersonaRow };
}

interface InvitacionRow {
  id: string;
  equipo_id: string;
  usuario_id: string;
  estado: InvitacionEstado;
  mensaje: string | null;
  created_at: string;
  responded_at: string | null;
}

interface InvitacionJoinRow extends InvitacionRow {
  equipo: { nombre: string };
  usuario: { email: string; persona: PersonaRow };
}

interface PartidoRow {
  id: string;
  equipo_id: string;
  rival: string;
  fecha: string;
  ubicacion: string | null;
  es_local: boolean;
  estado: Partido['estado'];
  goles_favor: number | null;
  goles_contra: number | null;
  notas: string | null;
  created_at: string;
}

interface GolRow {
  id: string;
  partido_id: string;
  usuario_id: string | null;
  minuto: number | null;
  usuario: { persona: { nombres: string; apellidos: string } } | null;
}

interface TarjetaRow {
  id: string;
  partido_id: string;
  usuario_id: string | null;
  tipo: TarjetaTipo;
  minuto: number | null;
  usuario: { persona: { nombres: string; apellidos: string } } | null;
}

const USUARIO_JOIN =
  '*, persona:persona_id(nombres, apellidos), rol:rol_id(nombre_rol)';
const MIEMBRO_JOIN =
  '*, usuario:usuario_id(email, persona:persona_id(nombres, apellidos))';
const INVITACION_JOIN =
  '*, equipo:equipo_id(nombre), usuario:usuario_id(email, persona:persona_id(nombres, apellidos))';
const EVENTO_JOIN =
  '*, usuario:usuario_id(persona:persona_id(nombres, apellidos))';

@Injectable()
export class SupabaseEquiposRepository extends EquiposRepository {
  private readonly authClient: SupabaseClient;
  private readonly dbClient: SupabaseClient;

  constructor(config: ConfigService) {
    super();
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseClient;
    this.dbClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseClient;
  }

  // ---------------- Identidad ----------------

  async getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
    const { data, error } = await this.authClient.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }
    return this.mapAuthUser(data.user);
  }

  async findUsuarioByAuthId(authId: string): Promise<Usuario | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select(USUARIO_JOIN)
      .eq('supabase_auth_id', authId)
      .maybeSingle<UsuarioJoinRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapUsuario(data) : null;
  }

  async findUsuarioByEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select(USUARIO_JOIN)
      .eq('email', email)
      .maybeSingle<UsuarioJoinRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapUsuario(data) : null;
  }

  // ---------------- Equipo ----------------

  async createEquipo(data: CreateEquipoData): Promise<Equipo> {
    const { data: row, error } = await this.dbClient
      .from('equipo')
      .insert({
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        categoria: data.categoria ?? null,
        ciudad: data.ciudad ?? null,
        escudo_url: data.escudoUrl ?? null,
        entrenador_id: data.entrenadorId,
      })
      .select('*')
      .single<EquipoRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo crear el equipo',
      );
    }
    return this.mapEquipo(row);
  }

  async findEquipoById(id: string): Promise<Equipo | null> {
    const { data, error } = await this.dbClient
      .from('equipo')
      .select('*')
      .eq('id', id)
      .maybeSingle<EquipoRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapEquipo(data) : null;
  }

  async listEquiposByUsuario(usuarioId: string): Promise<Equipo[]> {
    const { data: comoEntrenador, error: errEntrenador } = await this.dbClient
      .from('equipo')
      .select('*')
      .eq('entrenador_id', usuarioId);
    if (errEntrenador) {
      throw new EquiposProviderError(errEntrenador.message);
    }

    const { data: memberships, error: errMiembro } = await this.dbClient
      .from('equipo_miembro')
      .select('equipo_id')
      .eq('usuario_id', usuarioId);
    if (errMiembro) {
      throw new EquiposProviderError(errMiembro.message);
    }

    const equipos = new Map<string, Equipo>();
    for (const row of (comoEntrenador ?? []) as EquipoRow[]) {
      equipos.set(row.id, this.mapEquipo(row));
    }

    const memberIds = ((memberships ?? []) as { equipo_id: string }[])
      .map((m) => m.equipo_id)
      .filter((id) => !equipos.has(id));

    if (memberIds.length > 0) {
      const { data: comoMiembro, error: errEquipos } = await this.dbClient
        .from('equipo')
        .select('*')
        .in('id', memberIds);
      if (errEquipos) {
        throw new EquiposProviderError(errEquipos.message);
      }
      for (const row of (comoMiembro ?? []) as EquipoRow[]) {
        equipos.set(row.id, this.mapEquipo(row));
      }
    }

    return [...equipos.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async updateEquipo(id: string, data: UpdateEquipoData): Promise<Equipo> {
    const patch: Record<string, unknown> = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
    if (data.categoria !== undefined) patch.categoria = data.categoria;
    if (data.ciudad !== undefined) patch.ciudad = data.ciudad;
    if (data.escudoUrl !== undefined) patch.escudo_url = data.escudoUrl;
    if (data.formacion !== undefined) patch.formacion = data.formacion;

    const { data: row, error } = await this.dbClient
      .from('equipo')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<EquipoRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo actualizar el equipo',
      );
    }
    return this.mapEquipo(row);
  }

  async deleteEquipo(id: string): Promise<void> {
    const { error } = await this.dbClient.from('equipo').delete().eq('id', id);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
  }

  // ---------------- Miembros ----------------

  async findMiembro(
    equipoId: string,
    usuarioId: string,
  ): Promise<EquipoMiembro | null> {
    const { data, error } = await this.dbClient
      .from('equipo_miembro')
      .select('*')
      .eq('equipo_id', equipoId)
      .eq('usuario_id', usuarioId)
      .maybeSingle<MiembroRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapMiembro(data) : null;
  }

  async listMiembros(equipoId: string): Promise<MiembroDetalle[]> {
    const { data, error } = await this.dbClient
      .from('equipo_miembro')
      .select(MIEMBRO_JOIN)
      .eq('equipo_id', equipoId)
      .order('joined_at', { ascending: true });
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return ((data ?? []) as MiembroJoinRow[]).map((row) =>
      this.mapMiembroDetalle(row),
    );
  }

  async countMiembros(equipoId: string): Promise<number> {
    const { count, error } = await this.dbClient
      .from('equipo_miembro')
      .select('*', { count: 'exact', head: true })
      .eq('equipo_id', equipoId);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return count ?? 0;
  }

  async addMiembro(data: AddMiembroData): Promise<EquipoMiembro> {
    const { data: row, error } = await this.dbClient
      .from('equipo_miembro')
      .insert({
        equipo_id: data.equipoId,
        usuario_id: data.usuarioId,
        dorsal: data.dorsal ?? null,
        posicion: data.posicion ?? null,
      })
      .select('*')
      .single<MiembroRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo agregar el miembro',
      );
    }
    return this.mapMiembro(row);
  }

  async updateMiembro(
    equipoId: string,
    usuarioId: string,
    data: UpdateMiembroData,
  ): Promise<EquipoMiembro> {
    const patch: Record<string, unknown> = {};
    if (data.dorsal !== undefined) patch.dorsal = data.dorsal;
    if (data.posicion !== undefined) patch.posicion = data.posicion;
    if (data.slot !== undefined) patch.slot = data.slot;
    if (data.estado !== undefined) patch.estado = data.estado;

    const { data: row, error } = await this.dbClient
      .from('equipo_miembro')
      .update(patch)
      .eq('equipo_id', equipoId)
      .eq('usuario_id', usuarioId)
      .select('*')
      .single<MiembroRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo actualizar el miembro',
      );
    }
    return this.mapMiembro(row);
  }

  async clearSlot(
    equipoId: string,
    slot: string,
    exceptUsuarioId: string,
  ): Promise<void> {
    const { error } = await this.dbClient
      .from('equipo_miembro')
      .update({ slot: null })
      .eq('equipo_id', equipoId)
      .eq('slot', slot)
      .neq('usuario_id', exceptUsuarioId);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
  }

  async removeMiembro(equipoId: string, usuarioId: string): Promise<void> {
    const { error } = await this.dbClient
      .from('equipo_miembro')
      .delete()
      .eq('equipo_id', equipoId)
      .eq('usuario_id', usuarioId);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
  }

  // ---------------- Invitaciones ----------------

  async createInvitacion(data: CreateInvitacionData): Promise<Invitacion> {
    const { data: row, error } = await this.dbClient
      .from('invitacion')
      .insert({
        equipo_id: data.equipoId,
        usuario_id: data.usuarioId,
        mensaje: data.mensaje ?? null,
      })
      .select('*')
      .single<InvitacionRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo crear la invitación',
      );
    }
    return this.mapInvitacion(row);
  }

  async findInvitacionById(id: string): Promise<Invitacion | null> {
    const { data, error } = await this.dbClient
      .from('invitacion')
      .select('*')
      .eq('id', id)
      .maybeSingle<InvitacionRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapInvitacion(data) : null;
  }

  async findInvitacionPendiente(
    equipoId: string,
    usuarioId: string,
  ): Promise<Invitacion | null> {
    const { data, error } = await this.dbClient
      .from('invitacion')
      .select('*')
      .eq('equipo_id', equipoId)
      .eq('usuario_id', usuarioId)
      .eq('estado', 'pendiente')
      .maybeSingle<InvitacionRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapInvitacion(data) : null;
  }

  async listInvitacionesByEquipo(
    equipoId: string,
  ): Promise<InvitacionDetalle[]> {
    const { data, error } = await this.dbClient
      .from('invitacion')
      .select(INVITACION_JOIN)
      .eq('equipo_id', equipoId)
      .order('created_at', { ascending: false });
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return ((data ?? []) as InvitacionJoinRow[]).map((row) =>
      this.mapInvitacionDetalle(row),
    );
  }

  async listInvitacionesByUsuario(
    usuarioId: string,
    soloPendientes: boolean,
  ): Promise<InvitacionDetalle[]> {
    let query = this.dbClient
      .from('invitacion')
      .select(INVITACION_JOIN)
      .eq('usuario_id', usuarioId);
    if (soloPendientes) {
      query = query.eq('estado', 'pendiente');
    }
    const { data, error } = await query.order('created_at', {
      ascending: false,
    });
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return ((data ?? []) as InvitacionJoinRow[]).map((row) =>
      this.mapInvitacionDetalle(row),
    );
  }

  async updateInvitacionEstado(
    id: string,
    estado: InvitacionEstado,
  ): Promise<Invitacion> {
    const { data: row, error } = await this.dbClient
      .from('invitacion')
      .update({
        estado,
        responded_at: estado === 'pendiente' ? null : new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single<InvitacionRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo actualizar la invitación',
      );
    }
    return this.mapInvitacion(row);
  }

  // ---------------- Partidos ----------------

  async createPartido(data: CreatePartidoData): Promise<Partido> {
    const { data: row, error } = await this.dbClient
      .from('partido')
      .insert({
        equipo_id: data.equipoId,
        rival: data.rival,
        fecha: data.fecha,
        ubicacion: data.ubicacion ?? null,
        es_local: data.esLocal ?? true,
        notas: data.notas ?? null,
      })
      .select('*')
      .single<PartidoRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo crear el partido',
      );
    }
    return this.mapPartido(row);
  }

  async findPartidoById(id: string): Promise<Partido | null> {
    const { data, error } = await this.dbClient
      .from('partido')
      .select('*')
      .eq('id', id)
      .maybeSingle<PartidoRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapPartido(data) : null;
  }

  async listPartidosByEquipo(
    equipoId: string,
    filtro: PartidoFiltro,
  ): Promise<Partido[]> {
    let query = this.dbClient
      .from('partido')
      .select('*')
      .eq('equipo_id', equipoId);

    if (filtro === 'proximos') {
      query = query
        .eq('estado', 'programado')
        .gte('fecha', new Date().toISOString())
        .order('fecha', { ascending: true });
    } else if (filtro === 'anteriores') {
      query = query.eq('estado', 'finalizado').order('fecha', {
        ascending: false,
      });
    } else {
      query = query.order('fecha', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return ((data ?? []) as PartidoRow[]).map((row) => this.mapPartido(row));
  }

  async updatePartido(id: string, data: UpdatePartidoData): Promise<Partido> {
    const patch: Record<string, unknown> = {};
    if (data.rival !== undefined) patch.rival = data.rival;
    if (data.fecha !== undefined) patch.fecha = data.fecha;
    if (data.ubicacion !== undefined) patch.ubicacion = data.ubicacion;
    if (data.esLocal !== undefined) patch.es_local = data.esLocal;
    if (data.estado !== undefined) patch.estado = data.estado;
    if (data.golesFavor !== undefined) patch.goles_favor = data.golesFavor;
    if (data.golesContra !== undefined) patch.goles_contra = data.golesContra;
    if (data.notas !== undefined) patch.notas = data.notas;

    const { data: row, error } = await this.dbClient
      .from('partido')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<PartidoRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo actualizar el partido',
      );
    }
    return this.mapPartido(row);
  }

  async deletePartido(id: string): Promise<void> {
    const { error } = await this.dbClient.from('partido').delete().eq('id', id);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
  }

  async findPartidoDetalleById(id: string): Promise<PartidoDetalle | null> {
    const partido = await this.findPartidoById(id);
    if (!partido) {
      return null;
    }

    const [{ data: goles, error: golErr }, { data: tarjetas, error: tarErr }] =
      await Promise.all([
        this.dbClient
          .from('partido_gol')
          .select(EVENTO_JOIN)
          .eq('partido_id', id)
          .order('minuto', { ascending: true, nullsFirst: false }),
        this.dbClient
          .from('partido_tarjeta')
          .select(EVENTO_JOIN)
          .eq('partido_id', id)
          .order('minuto', { ascending: true, nullsFirst: false }),
      ]);
    if (golErr) throw new EquiposProviderError(golErr.message);
    if (tarErr) throw new EquiposProviderError(tarErr.message);

    return {
      ...partido,
      goles: ((goles ?? []) as GolRow[]).map((g) => this.mapGol(g)),
      tarjetas: ((tarjetas ?? []) as TarjetaRow[]).map((t) =>
        this.mapTarjeta(t),
      ),
    };
  }

  // ---------------- Goles y tarjetas ----------------

  async addGol(data: RegisterGolData): Promise<Gol> {
    const { data: row, error } = await this.dbClient
      .from('partido_gol')
      .insert({
        partido_id: data.partidoId,
        usuario_id: data.usuarioId ?? null,
        minuto: data.minuto ?? null,
      })
      .select(EVENTO_JOIN)
      .single<GolRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo registrar el gol',
      );
    }
    return this.mapGol(row);
  }

  async findGolById(id: string): Promise<Gol | null> {
    const { data, error } = await this.dbClient
      .from('partido_gol')
      .select(EVENTO_JOIN)
      .eq('id', id)
      .maybeSingle<GolRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapGol(data) : null;
  }

  async deleteGol(id: string): Promise<void> {
    const { error } = await this.dbClient
      .from('partido_gol')
      .delete()
      .eq('id', id);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
  }

  async addTarjeta(data: RegisterTarjetaData): Promise<Tarjeta> {
    const { data: row, error } = await this.dbClient
      .from('partido_tarjeta')
      .insert({
        partido_id: data.partidoId,
        usuario_id: data.usuarioId ?? null,
        tipo: data.tipo,
        minuto: data.minuto ?? null,
      })
      .select(EVENTO_JOIN)
      .single<TarjetaRow>();
    if (error || !row) {
      throw new EquiposProviderError(
        error?.message ?? 'No se pudo registrar la tarjeta',
      );
    }
    return this.mapTarjeta(row);
  }

  async findTarjetaById(id: string): Promise<Tarjeta | null> {
    const { data, error } = await this.dbClient
      .from('partido_tarjeta')
      .select(EVENTO_JOIN)
      .eq('id', id)
      .maybeSingle<TarjetaRow>();
    if (error) {
      throw new EquiposProviderError(error.message);
    }
    return data ? this.mapTarjeta(data) : null;
  }

  async deleteTarjeta(id: string): Promise<void> {
    const { error } = await this.dbClient
      .from('partido_tarjeta')
      .delete()
      .eq('id', id);
    if (error) {
      throw new EquiposProviderError(error.message);
    }
  }

  // ---------------- Mappers (snake_case -> camelCase) ----------------

  private mapAuthUser(user: User): AuthUser {
    const metadata = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? null,
      fullName:
        (metadata.full_name as string) ?? (metadata.name as string) ?? null,
    };
  }

  private mapUsuario(row: UsuarioJoinRow): Usuario {
    return {
      id: row.id,
      personaId: row.persona_id,
      rolId: row.rol_id,
      rolNombre: row.rol.nombre_rol,
      supabaseAuthId: row.supabase_auth_id,
      email: row.email,
      nombres: row.persona.nombres,
      apellidos: row.persona.apellidos,
      estado: row.estado,
    };
  }

  private mapEquipo(row: EquipoRow): Equipo {
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria: row.categoria,
      ciudad: row.ciudad,
      escudoUrl: row.escudo_url,
      formacion: row.formacion,
      entrenadorId: row.entrenador_id,
      createdAt: row.created_at,
    };
  }

  private mapMiembro(row: MiembroRow): EquipoMiembro {
    return {
      id: row.id,
      equipoId: row.equipo_id,
      usuarioId: row.usuario_id,
      dorsal: row.dorsal,
      posicion: row.posicion,
      slot: row.slot,
      estado: row.estado,
      joinedAt: row.joined_at,
    };
  }

  private mapMiembroDetalle(row: MiembroJoinRow): MiembroDetalle {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      nombres: row.usuario.persona.nombres,
      apellidos: row.usuario.persona.apellidos,
      email: row.usuario.email,
      dorsal: row.dorsal,
      posicion: row.posicion,
      slot: row.slot,
      estado: row.estado,
      joinedAt: row.joined_at,
    };
  }

  private mapInvitacion(row: InvitacionRow): Invitacion {
    return {
      id: row.id,
      equipoId: row.equipo_id,
      usuarioId: row.usuario_id,
      estado: row.estado,
      mensaje: row.mensaje,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
    };
  }

  private mapInvitacionDetalle(row: InvitacionJoinRow): InvitacionDetalle {
    return {
      id: row.id,
      equipoId: row.equipo_id,
      equipoNombre: row.equipo.nombre,
      usuarioId: row.usuario_id,
      jugadorNombres: row.usuario.persona.nombres,
      jugadorApellidos: row.usuario.persona.apellidos,
      jugadorEmail: row.usuario.email,
      estado: row.estado,
      mensaje: row.mensaje,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
    };
  }

  private mapPartido(row: PartidoRow): Partido {
    return {
      id: row.id,
      equipoId: row.equipo_id,
      rival: row.rival,
      fecha: row.fecha,
      ubicacion: row.ubicacion,
      esLocal: row.es_local,
      estado: row.estado,
      golesFavor: row.goles_favor,
      golesContra: row.goles_contra,
      notas: row.notas,
      createdAt: row.created_at,
    };
  }

  private mapGol(row: GolRow): Gol {
    return {
      id: row.id,
      partidoId: row.partido_id,
      usuarioId: row.usuario_id,
      jugadorNombres: row.usuario?.persona.nombres ?? null,
      jugadorApellidos: row.usuario?.persona.apellidos ?? null,
      minuto: row.minuto,
    };
  }

  private mapTarjeta(row: TarjetaRow): Tarjeta {
    return {
      id: row.id,
      partidoId: row.partido_id,
      usuarioId: row.usuario_id,
      jugadorNombres: row.usuario?.persona.nombres ?? null,
      jugadorApellidos: row.usuario?.persona.apellidos ?? null,
      tipo: row.tipo,
      minuto: row.minuto,
    };
  }
}

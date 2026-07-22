import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  EstadoJugador,
  EstadoLesion,
  Genero,
  ParteCuerpo,
  PiernaHabil,
  Posicion,
} from '../domain/catalogos';
import { AuthUser } from '../domain/entities/auth-user.entity';
import {
  Jugador,
  JugadorAtributo,
  JugadorFisico,
  JugadorLesion,
  JugadorPosicion,
} from '../domain/entities/jugador.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import { JugadoresProviderError } from '../domain/exceptions/jugadores.errors';
import {
  CreateJugadorData,
  CreateLesionData,
  CreatePosicionData,
  FotoPerfil,
  JugadorFiltro,
  JugadoresRepository,
  UpdateJugadorData,
  UpdateLesionData,
  UpdatePosicionData,
  UpsertAtributosData,
  UpsertFisicoData,
} from '../domain/repositories/jugadores.repository';

interface PersonaRow {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
}

interface UsuarioJoinRow {
  id: string;
  supabase_auth_id: string | null;
  email: string;
  persona: PersonaRow;
  rol: { nombre_rol: string };
}

interface JugadorRow {
  id: string;
  user_id: string;
  genero: Genero | null;
  nacionalidad: string | null;
  foto_url: string | null;
  pierna_habil: PiernaHabil | null;
  estado: EstadoJugador;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface FisicoRow {
  id: string;
  jugador_id: string;
  altura_cm: string | number | null;
  peso_kg: string | number | null;
  fecha_actualizacion: string;
}

interface PosicionRow {
  id: string;
  jugador_id: string;
  posicion: Posicion;
  es_principal: boolean;
}

interface AtributoRow {
  id: string;
  jugador_id: string;
  ataque: number;
  tactica: number;
  tecnica: number;
  defensa: number;
  creatividad: number;
  fecha_actualizacion: string;
}

interface LesionRow {
  id: string;
  jugador_id: string;
  parte_cuerpo: ParteCuerpo;
  nota: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoLesion;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

const USUARIO_JOIN =
  'id, supabase_auth_id, email, persona:persona_id(nombres, apellidos, fecha_nacimiento), rol:rol_id(nombre_rol)';

/**
 * Adaptador Supabase. Usa la service-role key porque todas las tablas del
 * módulo tienen RLS deny-all: el control de acceso vive en los casos de uso.
 */
@Injectable()
export class SupabaseJugadoresRepository extends JugadoresRepository {
  private readonly authClient: SupabaseClient;
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    super();
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'Perfil';

    this.authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseClient;
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseClient;
  }

  // ---------------- Auth / identidad ----------------

  async getUserFromAccessToken(token: string): Promise<AuthUser | null> {
    const { data, error } = await this.authClient.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return this.toAuthUser(data.user);
  }

  async findUsuarioByAuthId(authId: string): Promise<Usuario | null> {
    const { data, error } = await this.client
      .from('usuario')
      .select(USUARIO_JOIN)
      .eq('supabase_auth_id', authId)
      .maybeSingle<UsuarioJoinRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toUsuario(data) : null;
  }

  async findUsuariosByIds(ids: string[]): Promise<Usuario[]> {
    if (ids.length === 0) {
      return [];
    }
    const { data, error } = await this.client
      .from('usuario')
      .select(USUARIO_JOIN)
      .in('id', ids)
      .returns<UsuarioJoinRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toUsuario(row));
  }

  // ---------------- Jugador ----------------

  async createJugador(data: CreateJugadorData): Promise<Jugador> {
    const { data: row, error } = await this.client
      .from('jugador')
      .insert({
        user_id: data.userId,
        genero: data.genero ?? null,
        nacionalidad: data.nacionalidad ?? null,
        foto_url: data.fotoUrl ?? null,
        pierna_habil: data.piernaHabil ?? null,
        estado: data.estado ?? 'ACTIVO',
      })
      .select('*')
      .single<JugadorRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toJugador(row);
  }

  async findJugadorById(id: string): Promise<Jugador | null> {
    const { data, error } = await this.client
      .from('jugador')
      .select('*')
      .eq('id', id)
      .maybeSingle<JugadorRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toJugador(data) : null;
  }

  async findJugadorByUserId(userId: string): Promise<Jugador | null> {
    const { data, error } = await this.client
      .from('jugador')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<JugadorRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toJugador(data) : null;
  }

  async listJugadores(filtro: JugadorFiltro): Promise<Jugador[]> {
    // El filtro por posición se resuelve primero para no depender de un join
    // anidado con condición: `jugador_posicion` cubre principal y secundarias.
    let idsPorPosicion: string[] | null = null;
    if (filtro.posicion) {
      const { data, error } = await this.client
        .from('jugador_posicion')
        .select('jugador_id')
        .eq('posicion', filtro.posicion)
        .returns<{ jugador_id: string }[]>();

      if (error) {
        throw new JugadoresProviderError(error.message);
      }
      idsPorPosicion = (data ?? []).map((r) => r.jugador_id);
      if (idsPorPosicion.length === 0) {
        return [];
      }
    }

    let query = this.client.from('jugador').select('*');
    if (filtro.piernaHabil) {
      query = query.eq('pierna_habil', filtro.piernaHabil);
    }
    if (filtro.estado) {
      query = query.eq('estado', filtro.estado);
    }
    if (idsPorPosicion) {
      query = query.in('id', idsPorPosicion);
    }

    const { data, error } = await query
      .order('fecha_creacion', { ascending: false })
      .returns<JugadorRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toJugador(row));
  }

  async updateJugador(id: string, data: UpdateJugadorData): Promise<Jugador> {
    const payload = this.pruneUndefined({
      genero: data.genero,
      nacionalidad: data.nacionalidad,
      foto_url: data.fotoUrl,
      pierna_habil: data.piernaHabil,
      estado: data.estado,
      fecha_actualizacion: new Date().toISOString(),
    });

    const { data: row, error } = await this.client
      .from('jugador')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<JugadorRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toJugador(row);
  }

  // ---------------- Foto de perfil (Supabase Storage) ----------------

  async uploadFotoPerfil(jugadorId: string, foto: FotoPerfil): Promise<string> {
    // Una ruta por jugador con marca de tiempo: `upsert` evita acumular
    // archivos huérfanos y el sufijo rompe la caché del CDN al reemplazar.
    const extension = this.extensionDe(foto);
    const ruta = `jugadores/${jugadorId}/perfil-${Date.now()}.${extension}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(ruta, foto.buffer, {
        contentType: foto.mimeType,
        upsert: true,
      });

    if (error) {
      throw new JugadoresProviderError(
        `No se pudo subir la foto: ${error.message}`,
      );
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(ruta);
    return data.publicUrl;
  }

  private extensionDe(foto: FotoPerfil): string {
    const porNombre = /\.([a-z0-9]+)$/i.exec(foto.fileName)?.[1];
    if (porNombre) {
      return porNombre.toLowerCase();
    }
    const porMime = foto.mimeType.split('/')[1];
    return porMime === 'jpeg' ? 'jpg' : (porMime ?? 'jpg');
  }

  // ---------------- Físico ----------------

  async findFisico(jugadorId: string): Promise<JugadorFisico | null> {
    const { data, error } = await this.client
      .from('jugador_fisico')
      .select('*')
      .eq('jugador_id', jugadorId)
      .maybeSingle<FisicoRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toFisico(data) : null;
  }

  async findFisicoByJugadorIds(jugadorIds: string[]): Promise<JugadorFisico[]> {
    if (jugadorIds.length === 0) {
      return [];
    }
    const { data, error } = await this.client
      .from('jugador_fisico')
      .select('*')
      .in('jugador_id', jugadorIds)
      .returns<FisicoRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toFisico(row));
  }

  async upsertFisico(
    jugadorId: string,
    data: UpsertFisicoData,
  ): Promise<JugadorFisico> {
    const { data: row, error } = await this.client
      .from('jugador_fisico')
      .upsert(
        {
          jugador_id: jugadorId,
          ...this.pruneUndefined({
            altura_cm: data.alturaCm,
            peso_kg: data.pesoKg,
          }),
          fecha_actualizacion: new Date().toISOString(),
        },
        { onConflict: 'jugador_id' },
      )
      .select('*')
      .single<FisicoRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toFisico(row);
  }

  // ---------------- Posiciones ----------------

  async listPosiciones(jugadorId: string): Promise<JugadorPosicion[]> {
    const { data, error } = await this.client
      .from('jugador_posicion')
      .select('*')
      .eq('jugador_id', jugadorId)
      .order('es_principal', { ascending: false })
      .returns<PosicionRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toPosicion(row));
  }

  async listPosicionesByJugadorIds(
    jugadorIds: string[],
  ): Promise<JugadorPosicion[]> {
    if (jugadorIds.length === 0) {
      return [];
    }
    const { data, error } = await this.client
      .from('jugador_posicion')
      .select('*')
      .in('jugador_id', jugadorIds)
      .returns<PosicionRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toPosicion(row));
  }

  async findPosicionById(id: string): Promise<JugadorPosicion | null> {
    const { data, error } = await this.client
      .from('jugador_posicion')
      .select('*')
      .eq('id', id)
      .maybeSingle<PosicionRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toPosicion(data) : null;
  }

  async createPosicion(data: CreatePosicionData): Promise<JugadorPosicion> {
    const { data: row, error } = await this.client
      .from('jugador_posicion')
      .insert({
        jugador_id: data.jugadorId,
        posicion: data.posicion,
        es_principal: data.esPrincipal,
      })
      .select('*')
      .single<PosicionRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toPosicion(row);
  }

  async updatePosicion(
    id: string,
    data: UpdatePosicionData,
  ): Promise<JugadorPosicion> {
    const { data: row, error } = await this.client
      .from('jugador_posicion')
      .update(
        this.pruneUndefined({
          posicion: data.posicion,
          es_principal: data.esPrincipal,
        }),
      )
      .eq('id', id)
      .select('*')
      .single<PosicionRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toPosicion(row);
  }

  async deletePosicion(id: string): Promise<void> {
    const { error } = await this.client
      .from('jugador_posicion')
      .delete()
      .eq('id', id);

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
  }

  async clearPosicionPrincipal(
    jugadorId: string,
    exceptoId?: string,
  ): Promise<void> {
    let query = this.client
      .from('jugador_posicion')
      .update({ es_principal: false })
      .eq('jugador_id', jugadorId)
      .eq('es_principal', true);

    if (exceptoId) {
      query = query.neq('id', exceptoId);
    }

    const { error } = await query;
    if (error) {
      throw new JugadoresProviderError(error.message);
    }
  }

  // ---------------- Atributos ----------------

  async findAtributos(jugadorId: string): Promise<JugadorAtributo | null> {
    const { data, error } = await this.client
      .from('jugador_atributo')
      .select('*')
      .eq('jugador_id', jugadorId)
      .maybeSingle<AtributoRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toAtributo(data) : null;
  }

  async findAtributosByJugadorIds(
    jugadorIds: string[],
  ): Promise<JugadorAtributo[]> {
    if (jugadorIds.length === 0) {
      return [];
    }
    const { data, error } = await this.client
      .from('jugador_atributo')
      .select('*')
      .in('jugador_id', jugadorIds)
      .returns<AtributoRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toAtributo(row));
  }

  async upsertAtributos(
    jugadorId: string,
    data: UpsertAtributosData,
  ): Promise<JugadorAtributo> {
    const { data: row, error } = await this.client
      .from('jugador_atributo')
      .upsert(
        {
          jugador_id: jugadorId,
          ataque: data.ataque,
          tactica: data.tactica,
          tecnica: data.tecnica,
          defensa: data.defensa,
          creatividad: data.creatividad,
          fecha_actualizacion: new Date().toISOString(),
        },
        { onConflict: 'jugador_id' },
      )
      .select('*')
      .single<AtributoRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toAtributo(row);
  }

  // ---------------- Lesiones ----------------

  async listLesiones(jugadorId: string): Promise<JugadorLesion[]> {
    const { data, error } = await this.client
      .from('jugador_lesion')
      .select('*')
      .eq('jugador_id', jugadorId)
      .order('fecha_inicio', { ascending: false })
      .returns<LesionRow[]>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return (data ?? []).map((row) => this.toLesion(row));
  }

  async findLesionById(id: string): Promise<JugadorLesion | null> {
    const { data, error } = await this.client
      .from('jugador_lesion')
      .select('*')
      .eq('id', id)
      .maybeSingle<LesionRow>();

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
    return data ? this.toLesion(data) : null;
  }

  async createLesion(data: CreateLesionData): Promise<JugadorLesion> {
    const { data: row, error } = await this.client
      .from('jugador_lesion')
      .insert({
        jugador_id: data.jugadorId,
        parte_cuerpo: data.parteCuerpo,
        nota: data.nota,
        fecha_inicio: data.fechaInicio,
        fecha_fin: data.fechaFin ?? null,
        estado: data.estado ?? 'ACTIVA',
      })
      .select('*')
      .single<LesionRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toLesion(row);
  }

  async updateLesion(
    id: string,
    data: UpdateLesionData,
  ): Promise<JugadorLesion> {
    const payload = this.pruneUndefined({
      parte_cuerpo: data.parteCuerpo,
      nota: data.nota,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      estado: data.estado,
      fecha_actualizacion: new Date().toISOString(),
    });

    const { data: row, error } = await this.client
      .from('jugador_lesion')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<LesionRow>();

    if (error || !row) {
      throw new JugadoresProviderError(error?.message);
    }
    return this.toLesion(row);
  }

  async deleteLesion(id: string): Promise<void> {
    const { error } = await this.client
      .from('jugador_lesion')
      .delete()
      .eq('id', id);

    if (error) {
      throw new JugadoresProviderError(error.message);
    }
  }

  // ---------------- Mapeo ----------------

  private toAuthUser(user: User): AuthUser {
    const metadata = user.user_metadata ?? {};
    const fullName =
      typeof metadata.full_name === 'string' ? metadata.full_name : null;
    return { id: user.id, email: user.email ?? null, fullName };
  }

  private toUsuario(row: UsuarioJoinRow): Usuario {
    return {
      id: row.id,
      supabaseAuthId: row.supabase_auth_id,
      email: row.email,
      rolNombre: row.rol?.nombre_rol ?? '',
      nombres: row.persona?.nombres ?? '',
      apellidos: row.persona?.apellidos ?? '',
      fechaNacimiento: row.persona?.fecha_nacimiento ?? null,
    };
  }

  private toJugador(row: JugadorRow): Jugador {
    return {
      id: row.id,
      userId: row.user_id,
      genero: row.genero,
      nacionalidad: row.nacionalidad,
      fotoUrl: row.foto_url,
      piernaHabil: row.pierna_habil,
      estado: row.estado,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  private toFisico(row: FisicoRow): JugadorFisico {
    return {
      id: row.id,
      jugadorId: row.jugador_id,
      alturaCm: this.toNumber(row.altura_cm),
      pesoKg: this.toNumber(row.peso_kg),
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  private toPosicion(row: PosicionRow): JugadorPosicion {
    return {
      id: row.id,
      jugadorId: row.jugador_id,
      posicion: row.posicion,
      esPrincipal: row.es_principal,
    };
  }

  private toAtributo(row: AtributoRow): JugadorAtributo {
    return {
      id: row.id,
      jugadorId: row.jugador_id,
      ataque: row.ataque,
      tactica: row.tactica,
      tecnica: row.tecnica,
      defensa: row.defensa,
      creatividad: row.creatividad,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  private toLesion(row: LesionRow): JugadorLesion {
    return {
      id: row.id,
      jugadorId: row.jugador_id,
      parteCuerpo: row.parte_cuerpo,
      nota: row.nota,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      estado: row.estado,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  /** `numeric` llega como string desde PostgREST. */
  private toNumber(value: string | number | null): number | null {
    if (value === null) {
      return null;
    }
    return typeof value === 'number' ? value : Number(value);
  }

  /** Evita pisar columnas que el cliente no envió (PATCH parcial). */
  private pruneUndefined<T extends Record<string, unknown>>(
    payload: T,
  ): Partial<T> {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}

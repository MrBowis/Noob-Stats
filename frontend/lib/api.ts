import { config } from './config';
import {
  Atributos,
  AuthResponse,
  AuthSessionDto,
  CreateEquipoPayload,
  CreateJugadorPayload,
  CreateLesionPayload,
  CreatePosicionPayload,
  CreatePartidoPayload,
  CreateRolPayload,
  CreateUsuarioAdminPayload,
  Equipo,
  EquipoMiembro,
  EstadisticasAdmin,
  EstadisticasEquipo,
  EstadoLesion,
  Invitacion,
  Jugador,
  JugadorAtributo,
  JugadorFiltro,
  JugadorFisico,
  JugadorLesion,
  JugadorPosicion,
  ResumenAtributos,
  ResumenJugador,
  UpdateFisicoPayload,
  UpdateJugadorPayload,
  UpdateLesionPayload,
  UpdatePosicionPayload,
  InvitacionDetalle,
  InvitarJugadorPayload,
  Gol,
  MiembroDetalle,
  Partido,
  PartidoDetalle,
  PartidoFiltro,
  RegisterGolPayload,
  RegisterPayload,
  RegisterTarjetaPayload,
  Tarjeta,
  ResponderInvitacionResult,
  Rol,
  UpdateEquipoPayload,
  UpdateMiembroPayload,
  UpdatePartidoPayload,
  UpdateProfilePayload,
  UpdateRolPayload,
  UpdateUsuarioAdminPayload,
  UserProfile,
  UsuarioDetalle,
} from './types';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    baseUrl?: string;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const base = options.baseUrl ?? config.authApiUrl;
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ??
      `Error ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

/** Variante de `request` apuntando al microservicio equipos-ms. */
function equiposRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token: string },
): Promise<T> {
  return request<T>(path, { ...options, baseUrl: config.equiposApiUrl });
}

/** Variante de `request` apuntando al microservicio jugadores-ms. */
function jugadoresRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token: string },
): Promise<T> {
  return request<T>(path, { ...options, baseUrl: config.jugadoresApiUrl });
}

/** Variante de `request` apuntando al microservicio admin-ms. */
function adminRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token: string },
): Promise<T> {
  return request<T>(path, { ...options, baseUrl: config.adminApiUrl });
}

/**
 * Cliente del microservicio auth-ms.
 */
export const authApi = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async googleUrl(redirectTo: string): Promise<{ url: string }> {
    const params = new URLSearchParams({ redirectTo });
    const data = await request<any>(`/auth/google/url?${params.toString()}`);

    // Manejar múltiples formatos posibles por temas de caché o versiones
    if (typeof data === 'string') return { url: data };
    if (data?.url && typeof data.url === 'object' && data.url.url) {
      return { url: data.url.url };
    }
    return data;
  },

  googleCallback(
    accessToken: string,
    rolNombre?: string,
  ): Promise<{ profile: UserProfile; isNewUser: boolean }> {
    return request('/auth/google/callback', {
      method: 'POST',
      body: { accessToken, rolNombre },
    });
  },

  refresh(refreshToken: string): Promise<AuthSessionDto> {
    return request<AuthSessionDto>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  },

  me(token: string): Promise<UserProfile> {
    return request<UserProfile>('/auth/me', { token });
  },

  updateMe(token: string, payload: UpdateProfilePayload): Promise<UserProfile> {
    return request<UserProfile>('/auth/me', {
      method: 'PATCH',
      body: payload,
      token,
    });
  },
};

/**
 * Cliente del microservicio equipos-ms. Todos los métodos reciben el
 * access_token de Supabase como primer argumento.
 */
export const equiposApi = {
  // ---- Equipos ----
  listEquipos(token: string): Promise<Equipo[]> {
    return equiposRequest<Equipo[]>('/equipos', { token });
  },

  getEquipo(token: string, id: string): Promise<Equipo> {
    return equiposRequest<Equipo>(`/equipos/${id}`, { token });
  },

  createEquipo(token: string, payload: CreateEquipoPayload): Promise<Equipo> {
    return equiposRequest<Equipo>('/equipos', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateEquipo(
    token: string,
    id: string,
    payload: UpdateEquipoPayload,
  ): Promise<Equipo> {
    return equiposRequest<Equipo>(`/equipos/${id}`, {
      method: 'PATCH',
      body: payload,
      token,
    });
  },

  deleteEquipo(token: string, id: string): Promise<void> {
    return equiposRequest<void>(`/equipos/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Miembros ----
  listMiembros(token: string, id: string): Promise<MiembroDetalle[]> {
    return equiposRequest<MiembroDetalle[]>(`/equipos/${id}/miembros`, {
      token,
    });
  },

  updateMiembro(
    token: string,
    id: string,
    usuarioId: string,
    payload: UpdateMiembroPayload,
  ): Promise<EquipoMiembro> {
    return equiposRequest<EquipoMiembro>(
      `/equipos/${id}/miembros/${usuarioId}`,
      { method: 'PATCH', body: payload, token },
    );
  },

  removeMiembro(token: string, id: string, usuarioId: string): Promise<void> {
    return equiposRequest<void>(`/equipos/${id}/miembros/${usuarioId}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Invitaciones ----
  invitarJugador(
    token: string,
    id: string,
    payload: InvitarJugadorPayload,
  ): Promise<Invitacion> {
    return equiposRequest<Invitacion>(`/equipos/${id}/invitaciones`, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  listInvitacionesEquipo(
    token: string,
    id: string,
  ): Promise<InvitacionDetalle[]> {
    return equiposRequest<InvitacionDetalle[]>(`/equipos/${id}/invitaciones`, {
      token,
    });
  },

  listMisInvitaciones(
    token: string,
    soloPendientes = false,
  ): Promise<InvitacionDetalle[]> {
    const query = soloPendientes ? '?pendientes=true' : '';
    return equiposRequest<InvitacionDetalle[]>(`/invitaciones/mias${query}`, {
      token,
    });
  },

  responderInvitacion(
    token: string,
    id: string,
    aceptar: boolean,
  ): Promise<ResponderInvitacionResult> {
    return equiposRequest<ResponderInvitacionResult>(
      `/invitaciones/${id}/responder`,
      { method: 'POST', body: { aceptar }, token },
    );
  },

  cancelarInvitacion(token: string, id: string): Promise<Invitacion> {
    return equiposRequest<Invitacion>(`/invitaciones/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Partidos ----
  createPartido(
    token: string,
    id: string,
    payload: CreatePartidoPayload,
  ): Promise<Partido> {
    return equiposRequest<Partido>(`/equipos/${id}/partidos`, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  listPartidos(
    token: string,
    id: string,
    filtro: PartidoFiltro = 'todos',
  ): Promise<Partido[]> {
    return equiposRequest<Partido[]>(`/equipos/${id}/partidos?tipo=${filtro}`, {
      token,
    });
  },

  getPartido(token: string, partidoId: string): Promise<PartidoDetalle> {
    return equiposRequest<PartidoDetalle>(`/partidos/${partidoId}`, { token });
  },

  updatePartido(
    token: string,
    partidoId: string,
    payload: UpdatePartidoPayload,
  ): Promise<Partido> {
    return equiposRequest<Partido>(`/partidos/${partidoId}`, {
      method: 'PATCH',
      body: payload,
      token,
    });
  },

  // ---- Goles y tarjetas ----
  addGol(
    token: string,
    partidoId: string,
    payload: RegisterGolPayload,
  ): Promise<Gol> {
    return equiposRequest<Gol>(`/partidos/${partidoId}/goles`, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  deleteGol(token: string, partidoId: string, golId: string): Promise<void> {
    return equiposRequest<void>(`/partidos/${partidoId}/goles/${golId}`, {
      method: 'DELETE',
      token,
    });
  },

  addTarjeta(
    token: string,
    partidoId: string,
    payload: RegisterTarjetaPayload,
  ): Promise<Tarjeta> {
    return equiposRequest<Tarjeta>(`/partidos/${partidoId}/tarjetas`, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  deleteTarjeta(
    token: string,
    partidoId: string,
    tarjetaId: string,
  ): Promise<void> {
    return equiposRequest<void>(
      `/partidos/${partidoId}/tarjetas/${tarjetaId}`,
      { method: 'DELETE', token },
    );
  },

  deletePartido(token: string, partidoId: string): Promise<void> {
    return equiposRequest<void>(`/partidos/${partidoId}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Estadísticas ----
  getEstadisticas(token: string, id: string): Promise<EstadisticasEquipo> {
    return equiposRequest<EstadisticasEquipo>(`/equipos/${id}/estadisticas`, {
      token,
    });
  },
};

/**
 * Cliente del microservicio jugadores-ms (perfil deportivo del futbolista).
 * La lectura es pública para cualquier usuario autenticado; la escritura sólo
 * la permite el backend al propietario del perfil.
 */
export const jugadoresApi = {
  // ---- Perfil ----
  listJugadores(token: string, filtro: JugadorFiltro = {}): Promise<Jugador[]> {
    const params = new URLSearchParams();
    if (filtro.posicion) params.set('posicion', filtro.posicion);
    if (filtro.piernaHabil) params.set('piernaHabil', filtro.piernaHabil);
    if (filtro.estado) params.set('estado', filtro.estado);
    const query = params.toString() ? `?${params.toString()}` : '';
    return jugadoresRequest<Jugador[]>(`/jugadores${query}`, { token });
  },

  getMiJugador(token: string): Promise<Jugador> {
    return jugadoresRequest<Jugador>('/jugadores/me', { token });
  },

  getJugador(token: string, id: string): Promise<Jugador> {
    return jugadoresRequest<Jugador>(`/jugadores/${id}`, { token });
  },

  createJugador(
    token: string,
    payload: CreateJugadorPayload,
  ): Promise<Jugador> {
    return jugadoresRequest<Jugador>('/jugadores', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateJugador(
    token: string,
    id: string,
    payload: UpdateJugadorPayload,
  ): Promise<Jugador> {
    return jugadoresRequest<Jugador>(`/jugadores/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  /**
   * Sube la foto al bucket de Supabase Storage y devuelve el perfil con la
   * nueva `fotoUrl`. No se fija `Content-Type`: lo pone el runtime junto con
   * el boundary del multipart.
   */
  async uploadFoto(
    token: string,
    id: string,
    foto: { uri: string; name: string; type: string },
  ): Promise<Jugador> {
    const form = new FormData();
    if (foto.uri.startsWith('data:') || foto.uri.startsWith('blob:')) {
      // En web el picker devuelve un data/blob URI: hay que materializarlo.
      const blob = await fetch(foto.uri).then((r) => r.blob());
      form.append('file', blob, foto.name);
    } else {
      form.append('file', {
        uri: foto.uri,
        name: foto.name,
        type: foto.type,
      } as unknown as Blob);
    }

    const response = await fetch(
      `${config.jugadoresApiUrl}/jugadores/${id}/foto`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );

    const text = await response.text();
    const data: unknown = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new ApiError(
        response.status,
        (data as { message?: string } | null)?.message ??
          `Error ${response.status}`,
      );
    }
    return data as Jugador;
  },

  // ---- Datos físicos ----
  getFisico(token: string, id: string): Promise<JugadorFisico | null> {
    return jugadoresRequest<JugadorFisico | null>(`/jugadores/${id}/fisico`, {
      token,
    });
  },

  updateFisico(
    token: string,
    id: string,
    payload: UpdateFisicoPayload,
  ): Promise<JugadorFisico> {
    return jugadoresRequest<JugadorFisico>(`/jugadores/${id}/fisico`, {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  // ---- Posiciones ----
  listPosiciones(token: string, id: string): Promise<JugadorPosicion[]> {
    return jugadoresRequest<JugadorPosicion[]>(`/jugadores/${id}/posiciones`, {
      token,
    });
  },

  addPosicion(
    token: string,
    id: string,
    payload: CreatePosicionPayload,
  ): Promise<JugadorPosicion> {
    return jugadoresRequest<JugadorPosicion>(`/jugadores/${id}/posiciones`, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updatePosicion(
    token: string,
    id: string,
    posicionId: string,
    payload: UpdatePosicionPayload,
  ): Promise<JugadorPosicion> {
    return jugadoresRequest<JugadorPosicion>(
      `/jugadores/${id}/posiciones/${posicionId}`,
      { method: 'PUT', body: payload, token },
    );
  },

  deletePosicion(token: string, id: string, posicionId: string): Promise<void> {
    return jugadoresRequest<void>(`/jugadores/${id}/posiciones/${posicionId}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Atributos ----
  getAtributos(token: string, id: string): Promise<JugadorAtributo | null> {
    return jugadoresRequest<JugadorAtributo | null>(
      `/jugadores/${id}/atributos`,
      { token },
    );
  },

  updateAtributos(
    token: string,
    id: string,
    payload: Atributos,
  ): Promise<JugadorAtributo> {
    return jugadoresRequest<JugadorAtributo>(`/jugadores/${id}/atributos`, {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  getResumenAtributos(token: string, id: string): Promise<ResumenAtributos> {
    return jugadoresRequest<ResumenAtributos>(
      `/jugadores/${id}/resumen-atributos`,
      { token },
    );
  },

  // ---- Resumen e integración ----
  getResumen(token: string, id: string): Promise<ResumenJugador> {
    return jugadoresRequest<ResumenJugador>(`/jugadores/${id}/resumen`, {
      token,
    });
  },

  listEquipos(token: string, id: string): Promise<Equipo[]> {
    return jugadoresRequest<Equipo[]>(`/jugadores/${id}/equipos`, { token });
  },

  // ---- Lesiones ----
  listLesiones(
    token: string,
    id: string,
    estado?: EstadoLesion,
  ): Promise<JugadorLesion[]> {
    const query = estado ? `?estado=${estado}` : '';
    return jugadoresRequest<JugadorLesion[]>(
      `/jugadores/${id}/lesiones${query}`,
      { token },
    );
  },

  createLesion(
    token: string,
    id: string,
    payload: CreateLesionPayload,
  ): Promise<JugadorLesion> {
    return jugadoresRequest<JugadorLesion>(`/jugadores/${id}/lesiones`, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateLesion(
    token: string,
    id: string,
    lesionId: string,
    payload: UpdateLesionPayload,
  ): Promise<JugadorLesion> {
    return jugadoresRequest<JugadorLesion>(
      `/jugadores/${id}/lesiones/${lesionId}`,
      { method: 'PUT', body: payload, token },
    );
  },

  deleteLesion(token: string, id: string, lesionId: string): Promise<void> {
    return jugadoresRequest<void>(`/jugadores/${id}/lesiones/${lesionId}`, {
      method: 'DELETE',
      token,
    });
  },
};

/**
 * Cliente del microservicio admin-ms (gestión de usuarios y roles).
 * Todas las rutas requieren un token de un usuario con rol Administrador.
 */
export const adminApi = {
  // ---- Roles ----
  listRoles(token: string): Promise<Rol[]> {
    return adminRequest<Rol[]>('/roles', { token });
  },

  getRol(token: string, id: string): Promise<Rol> {
    return adminRequest<Rol>(`/roles/${id}`, { token });
  },

  createRol(token: string, payload: CreateRolPayload): Promise<Rol> {
    return adminRequest<Rol>('/roles', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateRol(
    token: string,
    id: string,
    payload: UpdateRolPayload,
  ): Promise<Rol> {
    return adminRequest<Rol>(`/roles/${id}`, {
      method: 'PATCH',
      body: payload,
      token,
    });
  },

  deleteRol(token: string, id: string): Promise<void> {
    return adminRequest<void>(`/roles/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Usuarios ----
  listUsuarios(token: string, estado?: string): Promise<UsuarioDetalle[]> {
    const query = estado ? `?estado=${estado}` : '';
    return adminRequest<UsuarioDetalle[]>(`/usuarios${query}`, { token });
  },

  getUsuario(token: string, id: string): Promise<UsuarioDetalle> {
    return adminRequest<UsuarioDetalle>(`/usuarios/${id}`, { token });
  },

  createUsuario(
    token: string,
    payload: CreateUsuarioAdminPayload,
  ): Promise<UsuarioDetalle> {
    return adminRequest<UsuarioDetalle>('/usuarios', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateUsuario(
    token: string,
    id: string,
    payload: UpdateUsuarioAdminPayload,
  ): Promise<UsuarioDetalle> {
    return adminRequest<UsuarioDetalle>(`/usuarios/${id}`, {
      method: 'PATCH',
      body: payload,
      token,
    });
  },

  deactivateUsuario(token: string, id: string): Promise<UsuarioDetalle> {
    return adminRequest<UsuarioDetalle>(`/usuarios/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // ---- Estadísticas ----
  getEstadisticas(token: string): Promise<EstadisticasAdmin> {
    return adminRequest<EstadisticasAdmin>('/estadisticas', { token });
  },
};

export { ApiError };

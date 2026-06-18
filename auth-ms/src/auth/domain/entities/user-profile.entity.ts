import { Persona } from './persona.entity';
import { Rol } from './rol.entity';
import { Usuario } from './usuario.entity';

/**
 * Perfil completo del usuario autenticado: agrega Usuario + Persona + Rol.
 */
export interface UserProfile {
  usuario: Usuario;
  persona: Persona;
  rol: Rol;
}

import { Persona } from './persona.entity';
import { Rol } from './rol.entity';

/**
 * Vista completa de un usuario para la gestión administrativa:
 * agrega los datos de Usuario + Persona + Rol.
 */
export interface UsuarioDetalle {
  id: string;
  email: string;
  estado: string;
  supabaseAuthId: string | null;
  createdAt: string;
  persona: Persona;
  rol: Rol;
}

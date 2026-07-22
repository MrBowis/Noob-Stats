import { Formacion } from '../formations';

/**
 * Equipo de fútbol gestionado por un Entrenador.
 */
export interface Equipo {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  ciudad: string | null;
  escudoUrl: string | null;
  formacion: Formacion;
  entrenadorId: string;
  createdAt: string;
}

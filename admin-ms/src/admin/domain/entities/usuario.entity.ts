export interface Usuario {
  id: string;
  personaId: string;
  rolId: string;
  supabaseAuthId: string | null;
  email: string;
  estado: string;
  createdAt: string;
}

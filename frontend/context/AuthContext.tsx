import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../lib/api';
import { parseTokensFromUrl } from '../lib/parse-tokens';
import { SESSION_KEY, sessionStorage } from '../lib/session-storage';
import { AuthSessionDto, RegisterPayload, UserProfile } from '../lib/types';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  session: AuthSessionDto | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (payload: RegisterPayload) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readSession(): Promise<AuthSessionDto | null> {
  try {
    const raw = await sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSessionDto) : null;
  } catch {
    return null;
  }
}

async function writeSession(s: AuthSessionDto): Promise<void> {
  await sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

async function deleteSession(): Promise<void> {
  await sessionStorage.removeItem(SESSION_KEY);
}

function isNearExpiry(s: AuthSessionDto): boolean {
  if (!s.expiresAt) return false;
  // Considera expirado si quedan menos de 60 segundos (expiresAt es Unix en segundos).
  return s.expiresAt - 60 < Date.now() / 1000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSessionDto | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      let stored = await readSession();

      if (!stored) {
        if (mounted) setLoading(false);
        return;
      }

      if (isNearExpiry(stored)) {
        try {
          stored = await authApi.refresh(stored.refreshToken);
          await writeSession(stored);
        } catch {
          await deleteSession();
          if (mounted) setLoading(false);
          return;
        }
      }

      try {
        const p = await authApi.me(stored.accessToken);
        if (mounted) {
          setSession(stored);
          setProfile(p);
        }
      } catch {
        await deleteSession();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { session: dto, profile: nextProfile } = await authApi.login(
        email,
        password,
      );
      if (dto) {
        await writeSession(dto);
        setSession(dto);
      }
      setProfile(nextProfile);
    },
    [],
  );

  const signUpWithEmail = useCallback(async (payload: RegisterPayload) => {
    const { session: dto, profile: nextProfile } =
      await authApi.register(payload);
    if (dto) {
      await writeSession(dto);
      setSession(dto);
    }
    setProfile(nextProfile);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL('auth-callback');
    const { url } = await authApi.googleUrl(redirectTo);

    if (!url || typeof url !== 'string') {
      throw new Error('No se pudo obtener la URL de Google OAuth');
    }

    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
    if (result.type !== 'success') return;

    const tokens = parseTokensFromUrl(result.url);
    if (!tokens) throw new Error('No se recibieron tokens de Google');

    const dto: AuthSessionDto = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      tokenType: 'bearer',
    };

    const { profile: nextProfile } = await authApi.googleCallback(
      tokens.accessToken,
    );
    await writeSession(dto);
    setSession(dto);
    setProfile(nextProfile);
  }, []);

  const signOut = useCallback(async () => {
    await deleteSession();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [
      session,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}

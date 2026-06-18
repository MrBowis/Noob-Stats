import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CTAButton } from '../../components/CTAButton';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../lib/api';
import { UserProfile } from '../../lib/types';
import { colors, radius, spacing, typography } from '../../theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { session, profile, signOut } = useAuth();
  const [fetched, setFetched] = useState<UserProfile | null>(profile);

  // Consume GET /auth/me para mostrar el perfil del usuario autenticado.
  useEffect(() => {
    if (!session) return;
    let active = true;
    void authApi
      .me(session.accessToken)
      .then((p) => {
        if (active) setFetched(p);
      })
      .catch(() => {
        /* se mantiene el perfil en memoria */
      });
    return () => {
      active = false;
    };
  }, [session]);

  const data = fetched ?? profile;

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.overline}>Tu perfil</Text>
        <Text style={typography.title}>
          Hola, {data?.persona.nombres ?? 'jugador'}
        </Text>

        <View style={styles.card}>
          <Field label="Nombre" value={`${data?.persona.nombres ?? ''} ${data?.persona.apellidos ?? ''}`.trim()} />
          <Field label="Correo" value={data?.usuario.email ?? '—'} />
          <Field label="Rol" value={data?.rol.nombreRol ?? '—'} />
          <Field label="Estado" value={data?.usuario.estado ?? '—'} />
        </View>

        <CTAButton
          label="Cerrar sesión"
          variant="outline"
          onPress={onSignOut}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={typography.overline}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  field: { gap: spacing.xs },
  value: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cta: { marginTop: spacing.xxl },
});

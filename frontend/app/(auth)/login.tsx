import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CTAButton } from '../../components/CTAButton';
import { GoogleIcon } from '../../components/GoogleIcon';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(app)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(app)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo usar Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={typography.overline}>Noob Stats</Text>
            <Text style={typography.title}>Iniciar sesión</Text>
            <Text style={[typography.body, styles.subtitle]}>
              Accede a tus estadísticas de fútbol amateur.
            </Text>
          </View>

          <TextField
            label="Correo"
            placeholder="tu@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CTAButton
            label="Iniciar sesión"
            onPress={onLogin}
            loading={loading}
            style={styles.cta}
          />
          <CTAButton
            label="Continuar con Google"
            variant="outline"
            icon={<GoogleIcon />}
            onPress={onGoogle}
            loading={googleLoading}
            style={styles.cta}
          />

          <View style={styles.footer}>
            <Text style={typography.body}>¿No tienes cuenta? </Text>
            <Link href="/(auth)/register" style={styles.link}>
              Regístrate
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  cta: { marginTop: spacing.md },
  error: {
    ...typography.body,
    color: colors.live,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});

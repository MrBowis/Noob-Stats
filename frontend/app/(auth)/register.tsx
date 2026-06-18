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
import { IconButton } from '../../components/IconButton';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail({
        email: email.trim(),
        password,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
      });
      router.replace('/(app)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
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
          <View style={styles.topBar}>
            <IconButton
              accessibilityLabel="Volver"
              onPress={() => router.back()}
            />
          </View>

          <View style={styles.header}>
            <Text style={typography.overline}>Noob Stats</Text>
            <Text style={typography.title}>Crear cuenta</Text>
            <Text style={[typography.body, styles.subtitle]}>
              Únete y empieza a registrar tu rendimiento.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <TextField
                label="Nombres"
                placeholder="Juan"
                value={nombres}
                onChangeText={setNombres}
              />
            </View>
            <View style={styles.half}>
              <TextField
                label="Apellidos"
                placeholder="Pérez"
                value={apellidos}
                onChangeText={setApellidos}
              />
            </View>
          </View>

          <TextField
            label="Correo"
            placeholder="example@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CTAButton
            label="Crear cuenta"
            onPress={onRegister}
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
            <Text style={typography.body}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Inicia sesión
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
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  topBar: { marginBottom: spacing.lg },
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
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
  link: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});

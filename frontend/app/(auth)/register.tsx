import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useToast } from '../../context/ToastContext';
import { validatePasswordStrength } from '../../lib/password';
import { colors, radius, spacing, typography } from '../../theme';

const ROLES = [
  { label: 'Futbolista', value: 'Futbolista' },
  { label: 'Entrenador', value: 'Entrenador' },
] as const;

type RolNombre = (typeof ROLES)[number]['value'];

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rolNombre, setRolNombre] = useState<RolNombre>('Futbolista');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onRegister = async () => {
    if (
      !nombres.trim() ||
      !apellidos.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail({
        email: email.trim(),
        password,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        rolNombre,
      });
      showToast('Cuenta creada correctamente', 'success');
      router.replace('/(app)/dashboard');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo crear la cuenta',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(rolNombre);
      router.replace('/(app)/dashboard');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo usar Google',
        'error',
      );
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
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextField
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Text style={[typography.body, styles.hint]}>
            Debe tener 8+ caracteres, mayúscula, minúscula, número y carácter
            especial.
          </Text>

          <Text style={[typography.overline, styles.roleLabel]}>Rol</Text>
          <View style={styles.roleRow}>
            {ROLES.map((rol) => {
              const selected = rolNombre === rol.value;
              return (
                <Pressable
                  key={rol.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setRolNombre(rol.value)}
                  style={[styles.roleOption, selected && styles.roleOptionSelected]}
                >
                  <Text
                    style={[
                      typography.buttonLabel,
                      {
                        color: selected ? colors.accentText : colors.textPrimary,
                      },
                    ]}
                  >
                    {rol.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
  hint: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  roleLabel: { marginBottom: spacing.sm },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleOption: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cta: { marginTop: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  link: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});

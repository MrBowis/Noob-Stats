import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CTAButton } from '../../../../components/CTAButton';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { SelectPills } from '../../../../components/SelectPills';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { adminApi } from '../../../../lib/api';
import { colors, spacing, typography } from '../../../../theme';

export default function NuevoUsuarioScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [rolesOptions, setRolesOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [email, setEmail] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [rolNombre, setRolNombre] = useState('');
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const roles = await adminApi.listRoles(token);
          if (!active) return;
          setRolesOptions(
            roles.map((r) => ({ label: r.nombreRol, value: r.nombreRol })),
          );
          if (roles.length > 0) setRolNombre((prev) => prev || roles[0].nombreRol);
        } catch (e) {
          showToast(
            e instanceof Error ? e.message : 'No se pudieron cargar los roles',
            'error',
          );
        } finally {
          if (active) setLoadingRoles(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [token, showToast]),
  );

  const onSubmit = async () => {
    if (!email.trim() || !nombres.trim() || !apellidos.trim()) {
      showToast('Email, nombres y apellidos son obligatorios', 'error');
      return;
    }
    if (!rolNombre) {
      showToast('Selecciona un rol', 'error');
      return;
    }
    setLoading(true);
    try {
      await adminApi.createUsuario(token, {
        email: email.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        rolNombre,
        fechaNacimiento: fechaNacimiento.trim() || undefined,
      });
      showToast('Usuario creado correctamente', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo crear el usuario',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="Crear usuario"
            subtitle="Registra el usuario de dominio con su rol."
            onBack={() => router.back()}
          />

          {loadingRoles ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <View>
              <TextField
                label="Correo"
                placeholder="nuevo@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextField
                label="Nombres"
                placeholder="Ana"
                value={nombres}
                onChangeText={setNombres}
              />
              <TextField
                label="Apellidos"
                placeholder="López"
                value={apellidos}
                onChangeText={setApellidos}
              />
              <TextField
                label="Fecha de nacimiento (opcional)"
                placeholder="AAAA-MM-DD"
                autoCapitalize="none"
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
              />
              {rolesOptions.length > 0 ? (
                <SelectPills
                  label="Rol"
                  options={rolesOptions}
                  value={rolNombre}
                  onChange={setRolNombre}
                />
              ) : (
                <Text style={[typography.body, styles.hint]}>
                  No hay roles disponibles. Crea uno primero.
                </Text>
              )}
              <CTAButton
                label="Crear usuario"
                onPress={onSubmit}
                loading={loading}
                disabled={rolesOptions.length === 0}
                style={styles.cta}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl },
  loader: { marginTop: spacing.xxl },
  hint: { marginBottom: spacing.lg },
  cta: { marginTop: spacing.md },
});

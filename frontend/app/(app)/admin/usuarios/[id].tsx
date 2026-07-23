import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../../../components/Badge';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { CTAButton } from '../../../../components/CTAButton';
import { FormScreen } from '../../../../components/FormScreen';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { SelectPills } from '../../../../components/SelectPills';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { adminApi } from '../../../../lib/api';
import { colors, spacing, typography } from '../../../../theme';

const ESTADOS = [
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
] as const;

type EstadoUsuario = (typeof ESTADOS)[number]['value'];

export default function EditarUsuarioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [rolesOptions, setRolesOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [email, setEmail] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [rolNombre, setRolNombre] = useState('');
  const [estado, setEstado] = useState<EstadoUsuario>('activo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const [usuario, roles] = await Promise.all([
            adminApi.getUsuario(token, id),
            adminApi.listRoles(token),
          ]);
          if (!active) return;
          setRolesOptions(
            roles.map((r) => ({ label: r.nombreRol, value: r.nombreRol })),
          );
          setEmail(usuario.email);
          setNombres(usuario.persona.nombres);
          setApellidos(usuario.persona.apellidos);
          setCorreo(usuario.persona.correo ?? '');
          setFechaNacimiento(usuario.persona.fechaNacimiento ?? '');
          setRolNombre(usuario.rol.nombreRol);
          setEstado(usuario.estado === 'inactivo' ? 'inactivo' : 'activo');
        } catch (e) {
          showToast(
            e instanceof Error ? e.message : 'No se pudo cargar el usuario',
            'error',
          );
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [token, id, showToast]),
  );

  const onSubmit = async () => {
    if (!nombres.trim() || !apellidos.trim()) {
      showToast('Nombres y apellidos son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateUsuario(token, id, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim() || undefined,
        fechaNacimiento: fechaNacimiento.trim() || undefined,
        rolNombre,
        estado,
      });
      showToast('Usuario actualizado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar el usuario',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = () => {
    setConfirmVisible(true);
  };

  const deactivate = async () => {
    setConfirmVisible(false);
    try {
      await adminApi.deactivateUsuario(token, id);
      showToast('Usuario desactivado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo desactivar el usuario',
        'error',
      );
    }
  };

  return (
    <FormScreen>
      <ScreenHeader title="Editar usuario" onBack={() => router.back()} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <View>
          <View style={styles.emailRow}>
            <Text style={[typography.body, styles.email]}>{email}</Text>
            <Badge
              label={estado}
              tone={estado === 'activo' ? 'success' : 'danger'}
            />
          </View>

          <TextField
            label="Nombres"
            value={nombres}
            onChangeText={setNombres}
          />
          <TextField
            label="Apellidos"
            value={apellidos}
            onChangeText={setApellidos}
          />
          <TextField
            label="Correo de contacto"
            autoCapitalize="none"
            keyboardType="email-address"
            value={correo}
            onChangeText={setCorreo}
          />
          <TextField
            label="Fecha de nacimiento"
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
          ) : null}
          <SelectPills
            label="Estado"
            options={ESTADOS}
            value={estado}
            onChange={setEstado}
          />

          <CTAButton
            label="Guardar cambios"
            onPress={onSubmit}
            loading={saving}
            style={styles.cta}
          />
          {estado === 'activo' ? (
            <CTAButton
              label="Desactivar usuario"
              variant="outline"
              icon={
                <Ionicons
                  name="person-remove-outline"
                  size={18}
                  color={colors.live}
                />
              }
              onPress={confirmDeactivate}
              style={styles.cta}
            />
          ) : null}
        </View>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="Desactivar usuario"
        message="El usuario quedará inactivo (borrado lógico). ¿Continuar?"
        confirmLabel="Desactivar"
        destructive
        onConfirm={() => void deactivate()}
        onCancel={() => setConfirmVisible(false)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxl },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  email: { color: colors.textPrimary, fontWeight: '600', flex: 1 },
  cta: { marginTop: spacing.md },
});

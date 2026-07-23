import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CTAButton } from '../../../../components/CTAButton';
import { FormScreen } from '../../../../components/FormScreen';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { adminApi } from '../../../../lib/api';
import { spacing } from '../../../../theme';

export default function NuevoRolScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [nombreRol, setNombreRol] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!nombreRol.trim()) {
      showToast('El nombre del rol es obligatorio', 'error');
      return;
    }
    setLoading(true);
    try {
      await adminApi.createRol(token, {
        nombreRol: nombreRol.trim(),
        descripcion: descripcion.trim() || undefined,
      });
      showToast('Rol creado correctamente', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo crear el rol',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <ScreenHeader title="Crear rol" onBack={() => router.back()} />
      <View>
        <TextField
          label="Nombre del rol"
          placeholder="Arbitro"
          value={nombreRol}
          onChangeText={setNombreRol}
        />
        <TextField
          label="Descripción (opcional)"
          placeholder="Gestiona el arbitraje de los partidos"
          value={descripcion}
          onChangeText={setDescripcion}
        />
        <CTAButton
          label="Crear rol"
          onPress={onSubmit}
          loading={loading}
          style={styles.cta}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  cta: { marginTop: spacing.md },
});

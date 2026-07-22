import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CTAButton } from '../../../../components/CTAButton';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { adminApi } from '../../../../lib/api';
import { colors, spacing } from '../../../../theme';

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl },
  cta: { marginTop: spacing.md },
});

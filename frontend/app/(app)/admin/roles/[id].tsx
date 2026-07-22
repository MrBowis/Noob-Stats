import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function EditarRolScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [nombreRol, setNombreRol] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const rol = await adminApi.getRol(token, id);
          if (!active) return;
          setNombreRol(rol.nombreRol);
          setDescripcion(rol.descripcion ?? '');
        } catch (e) {
          showToast(
            e instanceof Error ? e.message : 'No se pudo cargar el rol',
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
    if (!nombreRol.trim()) {
      showToast('El nombre del rol es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateRol(token, id, {
        nombreRol: nombreRol.trim(),
        descripcion: descripcion.trim(),
      });
      showToast('Rol actualizado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar el rol',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar rol', '¿Seguro que deseas eliminar este rol?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  const remove = async () => {
    try {
      await adminApi.deleteRol(token, id);
      showToast('Rol eliminado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo eliminar el rol',
        'error',
      );
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
          <ScreenHeader title="Editar rol" onBack={() => router.back()} />

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <View>
              <TextField
                label="Nombre del rol"
                value={nombreRol}
                onChangeText={setNombreRol}
              />
              <TextField
                label="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
              />
              <CTAButton
                label="Guardar cambios"
                onPress={onSubmit}
                loading={saving}
                style={styles.cta}
              />
              <CTAButton
                label="Eliminar rol"
                variant="outline"
                icon={
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.live}
                  />
                }
                onPress={confirmDelete}
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
  cta: { marginTop: spacing.md },
});

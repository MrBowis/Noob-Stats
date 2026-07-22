import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { equiposApi } from '../../../../lib/api';
import { colors, spacing } from '../../../../theme';

export default function EditarEquipoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [escudoUrl, setEscudoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const eq = await equiposApi.getEquipo(token, id);
          if (!active) return;
          setNombre(eq.nombre);
          setDescripcion(eq.descripcion ?? '');
          setCategoria(eq.categoria ?? '');
          setCiudad(eq.ciudad ?? '');
          setEscudoUrl(eq.escudoUrl ?? '');
        } catch (e) {
          showToast(
            e instanceof Error ? e.message : 'No se pudo cargar el equipo',
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
    if (!nombre.trim()) {
      showToast('El nombre del equipo es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      await equiposApi.updateEquipo(token, id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoria: categoria.trim(),
        ciudad: ciudad.trim(),
        escudoUrl: escudoUrl.trim(),
      });
      showToast('Equipo actualizado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar el equipo',
        'error',
      );
    } finally {
      setSaving(false);
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
          <ScreenHeader title="Editar equipo" onBack={() => router.back()} />

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <View>
              <TextField
                label="Nombre"
                value={nombre}
                onChangeText={setNombre}
              />
              <TextField
                label="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
              />
              <TextField
                label="Categoría"
                value={categoria}
                onChangeText={setCategoria}
              />
              <TextField
                label="Ciudad"
                value={ciudad}
                onChangeText={setCiudad}
              />
              <TextField
                label="URL del escudo"
                autoCapitalize="none"
                keyboardType="url"
                value={escudoUrl}
                onChangeText={setEscudoUrl}
              />
              <CTAButton
                label="Guardar cambios"
                onPress={onSubmit}
                loading={saving}
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

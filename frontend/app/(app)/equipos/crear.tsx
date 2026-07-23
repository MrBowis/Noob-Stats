import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CTAButton } from '../../../components/CTAButton';
import { EmptyState } from '../../../components/EmptyState';
import { FormScreen } from '../../../components/FormScreen';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { equiposApi } from '../../../lib/api';
import { spacing } from '../../../theme';

export default function CrearEquipoScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';
  const isEntrenador = profile?.rol.nombreRol === 'Entrenador';

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [escudoUrl, setEscudoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!nombre.trim()) {
      showToast('El nombre del equipo es obligatorio', 'error');
      return;
    }
    setLoading(true);
    try {
      const equipo = await equiposApi.createEquipo(token, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria: categoria.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        escudoUrl: escudoUrl.trim() || undefined,
      });
      showToast('Equipo creado correctamente', 'success');
      router.replace(`/(app)/equipos/${equipo.id}`);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo crear el equipo',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <ScreenHeader
        title="Crear equipo"
        subtitle="Registra un nuevo equipo para gestionarlo."
        onBack={() => router.back()}
      />

      {!isEntrenador ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Solo entrenadores"
          message="Necesitas el rol de Entrenador para crear equipos."
        />
      ) : (
        <View>
          <TextField
            label="Nombre"
            placeholder="Real Noob FC"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextField
            label="Descripción"
            placeholder="Equipo amateur de la liga local"
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TextField
            label="Categoría"
            placeholder="Sub-20"
            value={categoria}
            onChangeText={setCategoria}
          />
          <TextField
            label="Ciudad"
            placeholder="Quito"
            value={ciudad}
            onChangeText={setCiudad}
          />
          <TextField
            label="URL del escudo"
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            value={escudoUrl}
            onChangeText={setEscudoUrl}
          />

          <CTAButton
            label="Crear equipo"
            onPress={onSubmit}
            loading={loading}
            style={styles.cta}
          />
        </View>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  cta: { marginTop: spacing.md },
});

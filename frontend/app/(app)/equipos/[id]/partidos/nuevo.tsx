import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CTAButton } from '../../../../../components/CTAButton';
import { DateTimeField } from '../../../../../components/DateTimeField';
import { ScreenHeader } from '../../../../../components/ScreenHeader';
import { SelectPills } from '../../../../../components/SelectPills';
import { TextField } from '../../../../../components/TextField';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import { equiposApi } from '../../../../../lib/api';
import { colors, spacing } from '../../../../../theme';

const LOCALIA = [
  { label: 'Local', value: 'local' },
  { label: 'Visitante', value: 'visitante' },
] as const;

type Localia = (typeof LOCALIA)[number]['value'];

export default function NuevoPartidoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [rival, setRival] = useState('');
  const [fecha, setFecha] = useState<string | null>(null);
  const [ubicacion, setUbicacion] = useState('');
  const [localia, setLocalia] = useState<Localia>('local');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!rival.trim()) {
      showToast('Ingresa el rival', 'error');
      return;
    }
    if (!fecha) {
      showToast('Ingresa una fecha y hora válidas', 'error');
      return;
    }
    setLoading(true);
    try {
      await equiposApi.createPartido(token, id, {
        rival: rival.trim(),
        fecha,
        ubicacion: ubicacion.trim() || undefined,
        esLocal: localia === 'local',
        notas: notas.trim() || undefined,
      });
      showToast('Partido programado', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo programar el partido',
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
            title="Programar partido"
            onBack={() => router.back()}
          />

          <View>
            <TextField
              label="Rival"
              placeholder="Deportivo Rival"
              value={rival}
              onChangeText={setRival}
            />
            <DateTimeField label="Fecha y hora" value={fecha} onChange={setFecha} />
            <TextField
              label="Ubicación (opcional)"
              placeholder="Estadio Municipal"
              value={ubicacion}
              onChangeText={setUbicacion}
            />
            <SelectPills
              label="Localía"
              options={LOCALIA}
              value={localia}
              onChange={setLocalia}
            />
            <TextField
              label="Notas (opcional)"
              placeholder="Partido de la fecha 3"
              value={notas}
              onChangeText={setNotas}
            />
            <CTAButton
              label="Programar partido"
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

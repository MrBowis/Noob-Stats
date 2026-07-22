import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { CTAButton } from '../../../../components/CTAButton';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { TextField } from '../../../../components/TextField';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { equiposApi } from '../../../../lib/api';
import { colors, spacing, typography } from '../../../../theme';

export default function InvitarJugadorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const token = session?.accessToken ?? '';

  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      showToast('Ingresa el correo del jugador', 'error');
      return;
    }
    setLoading(true);
    try {
      await equiposApi.invitarJugador(token, id, {
        jugadorEmail: email.trim(),
        mensaje: mensaje.trim() || undefined,
      });
      showToast('Invitación enviada', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo enviar la invitación',
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
            title="Invitar jugador"
            subtitle="El jugador debe aceptar la invitación para unirse."
            onBack={() => router.back()}
          />

          <View>
            <TextField
              label="Correo del jugador"
              placeholder="jugador@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Mensaje (opcional)"
              placeholder="Únete a nuestro equipo para la temporada"
              value={mensaje}
              onChangeText={setMensaje}
            />
            <Text style={[typography.body, styles.hint]}>
              El correo debe corresponder a un usuario con rol Futbolista.
            </Text>
            <CTAButton
              label="Enviar invitación"
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
  hint: { marginBottom: spacing.lg },
  cta: { marginTop: spacing.sm },
});

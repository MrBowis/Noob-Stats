import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CTAButton } from '../../../components/CTAButton';
import { DateField } from '../../../components/DateField';
import { FormScreen } from '../../../components/FormScreen';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { spacing } from '../../../theme';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [nombres, setNombres] = useState(profile?.persona.nombres ?? '');
  const [apellidos, setApellidos] = useState(profile?.persona.apellidos ?? '');
  const [correo, setCorreo] = useState(profile?.persona.correo ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(
    profile?.persona.fechaNacimiento ?? '',
  );
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!nombres.trim() || !apellidos.trim()) {
      showToast('Nombres y apellidos son obligatorios', 'error');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim() || undefined,
        fechaNacimiento: fechaNacimiento.trim() || undefined,
      });
      showToast('Información actualizada', 'success');
      router.back();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo actualizar la información',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <ScreenHeader title="Editar información" onBack={() => router.back()} />
      <View>
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
          label="Correo"
          autoCapitalize="none"
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
        />
        <DateField
          label="Fecha de nacimiento"
          value={fechaNacimiento || null}
          onChange={(v) => setFechaNacimiento(v ?? '')}
        />
        <CTAButton
          label="Guardar cambios"
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

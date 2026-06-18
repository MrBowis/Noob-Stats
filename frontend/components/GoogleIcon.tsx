import { StyleSheet, Text, View } from 'react-native';

/**
 * Marca "G" de Google simplificada para el botón de OAuth.
 */
export function GoogleIcon() {
  return (
    <View style={styles.circle}>
      <Text style={styles.letter}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#4285F4',
    fontSize: 15,
    fontWeight: '900',
  },
});

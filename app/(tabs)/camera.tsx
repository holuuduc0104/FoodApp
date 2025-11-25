import { View, Text, StyleSheet } from 'react-native';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Camera Detection Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  subtext: {
    fontSize: 16,
    color: '#95A99C',
    marginTop: 8,
  },
});

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIngredients } from '@/context/IngredientsContext';
import { Camera, Rotate3D, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const MOCK_INGREDIENTS = [
  'Tomato',
  'Onion',
  'Carrot',
  'Chicken Breast',
  'Garlic',
  'Bell Pepper',
  'Potato',
  'Broccoli',
  'Cucumber',
  'Lettuce',
];

export default function CameraScreen() {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const cameraRef = useRef(null);
  const { addIngredient } = useIngredients();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#4CAF50" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need your permission to detect ingredients from camera
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDetectIngredients = () => {
    setIsDetecting(true);

    setTimeout(() => {
      const randomCount = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...MOCK_INGREDIENTS].sort(() => 0.5 - Math.random());
      const detected = shuffled.slice(0, randomCount);

      detected.forEach((ingredient) => {
        addIngredient(ingredient);
      });

      setDetectedItems(detected);
      setIsDetecting(false);

      Alert.alert(
        'Detection Complete',
        `Found: ${detected.join(', ')}\n\nAdded to your ingredients!`,
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ingredient Detection</Text>
        <Text style={styles.headerSubtitle}>Point at your ingredients</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
        <View style={styles.cameraOverlay}>
          <View style={styles.detectionFrame} />
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        {detectedItems.length > 0 && (
          <View style={styles.detectedSection}>
            <Text style={styles.detectedLabel}>Last Detection:</Text>
            <View style={styles.detectedTags}>
              {detectedItems.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}>
            <Rotate3D size={20} color="#4CAF50" />
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detectButton,
              isDetecting && styles.detectButtonDisabled,
            ]}
            onPress={handleDetectIngredients}
            disabled={isDetecting}>
            <Sparkles size={20} color="#FFFFFF" />
            <Text style={styles.detectButtonText}>
              {isDetecting ? 'Detecting...' : 'Detect'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionFrame: {
    width: width * 0.75,
    height: width * 0.75,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  cornerTL: {
    position: 'absolute',
    top: (height * 0.4 - (width * 0.75) / 2),
    left: (width - width * 0.75) / 2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopColor: '#FF8C42',
    borderLeftColor: '#FF8C42',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: (height * 0.4 - (width * 0.75) / 2),
    right: (width - width * 0.75) / 2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopColor: '#FF8C42',
    borderRightColor: '#FF8C42',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: (height * 0.4 - (width * 0.75) / 2),
    left: (width - width * 0.75) / 2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomColor: '#FF8C42',
    borderLeftColor: '#FF8C42',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: (height * 0.4 - (width * 0.75) / 2),
    right: (width - width * 0.75) / 2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomColor: '#FF8C42',
    borderRightColor: '#FF8C42',
    borderBottomRightRadius: 8,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detectedSection: {
    marginBottom: 20,
  },
  detectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  detectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tagText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  flipButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  detectButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  detectButtonDisabled: {
    opacity: 0.6,
  },
  detectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

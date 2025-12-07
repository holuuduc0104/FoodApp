import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIngredients } from '@/context/IngredientsContext';
import { Camera, Rotate3D, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import { analyzeFoodImage, detectIngredients } from '@/services/api';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);
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

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      setIsDetecting(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      await analyzeImage(photo.uri);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      
      const response = await analyzeFoodImage(imageUri);
      
      if (response.success && response.data) {
        if (response.data.error) {
          Alert.alert('Thông báo', response.data.error + '\n' + (response.data.suggestion || ''));
        } else {
          setAnalysisResult(response.data);
          
          // Add ingredients to context
          if (response.data.ingredients) {
            response.data.ingredients.forEach((ing) => {
              addIngredient(ing.name);
            });
          }
          
          Alert.alert(
            'Phân tích thành công!',
            `Món ăn: ${response.data.dish_name}\n\nĐã thêm ${response.data.ingredients?.length || 0} nguyên liệu vào danh sách của bạn.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Lỗi', 'Không thể phân tích ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
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
        {isAnalyzing && (
          <View style={styles.analyzingSection}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.analyzingText}>Đang phân tích ảnh với AI...</Text>
          </View>
        )}

        {analysisResult && !isAnalyzing && (
          <ScrollView style={styles.resultSection} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultTitle}>{analysisResult.dish_name}</Text>
            {analysisResult.description && (
              <Text style={styles.resultDescription}>{analysisResult.description}</Text>
            )}
            
            {analysisResult.ingredients && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>Nguyên liệu:</Text>
                {analysisResult.ingredients.map((ing: any, index: number) => (
                  <Text key={index} style={styles.ingredientItem}>
                    • {ing.name}: {ing.quantity} {ing.unit}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
            disabled={isDetecting || isAnalyzing}>
            <Rotate3D size={20} color="#4CAF50" />
            <Text style={styles.flipButtonText}>Lật</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickButton}
            onPress={handlePickImage}
            disabled={isDetecting || isAnalyzing}>
            <ImageIcon size={20} color="#4CAF50" />
            <Text style={styles.pickButtonText}>Chọn ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detectButton,
              (isDetecting || isAnalyzing) && styles.detectButtonDisabled,
            ]}
            onPress={handleTakePhoto}
            disabled={isDetecting || isAnalyzing}>
            <Camera size={20} color="#FFFFFF" />
            <Text style={styles.detectButtonText}>
              {isDetecting ? 'Đang chụp...' : 'Chụp'}
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
    maxHeight: height * 0.5,
  },
  analyzingSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  resultSection: {
    marginBottom: 16,
    maxHeight: height * 0.3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  ingredientsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  flipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 4,
  },
  flipButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 4,
  },
  pickButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  detectButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  detectButtonDisabled: {
    opacity: 0.6,
  },
  detectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

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
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIngredients } from '@/context/IngredientsContext';
import { Camera, Rotate3D, Sparkles, Image as ImageIcon, Heart, X } from 'lucide-react-native';
import { analyzeFoodImage } from '@/services/api';
import { API_URL } from '@/config/api';
import { supabase } from '../../supabase';

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
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
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
      Alert.alert('Error', 'Unable to take photo. Please try again.');
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
      Alert.alert('Error', 'Unable to pick image. Please try again.');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      
      console.log('=== Starting image analysis ===');
      console.log('Image URI:', imageUri);
      
      const response = await analyzeFoodImage(imageUri);
      
      console.log('=== API Response ===');
      console.log('Success:', response.success);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
      if (response.success && response.data) {
        if (response.data.error) {
          console.log('AI detected error:', response.data.error);
          Alert.alert('Thông báo', response.data.error + '\n' + (response.data.suggestion || ''));
        } else {
          // Add image_url to result
          const resultWithImage = {
            ...response.data,
            image_url: imageUri  // Save the image URI
          };
          console.log('Setting analysis result:', resultWithImage);
          setAnalysisResult(resultWithImage);
          setShowResultModal(true);
          
          // Add ingredients to context
          if (response.data.ingredients && Array.isArray(response.data.ingredients)) {
            console.log('Adding ingredients to context:', response.data.ingredients);
            response.data.ingredients.forEach((ing) => {
              if (typeof ing === 'string') {
                addIngredient(ing);
              }
            });
          }
        }
      } else {
        console.error('Invalid response:', response);
        Alert.alert('Error', 'AI response không hợp lệ');
      }
    } catch (error: any) {
      console.error('=== Error analyzing image ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Lỗi phân tích ảnh: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
      console.log('=== Analysis complete ===');
    }
  };

  const handleAddToFavorite = async () => {
    if (!analysisResult) return;
    
    try {
      setIsSavingFavorite(true);
      
      // Get current user from Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session check:', { hasSession: !!session, error });
      
      if (!session?.user?.id) {
        console.log('No user found in session');
        Alert.alert('Not Logged In', 'No session found. Please login first, then try again.');
        setShowResultModal(false);
        setIsSavingFavorite(false);
        return;
      }
      
      const userId = session.user.id;
      console.log('Current user ID:', userId);
      
      // Prepare recipe data with user_id
      const recipeData = {
        user_id: userId,  // Send user_id in body instead of header
        name: analysisResult.name,
        description: analysisResult.description || '',
        ingredients: analysisResult.ingredients || [],
        instructions: analysisResult.instructions || (analysisResult.description ? [analysisResult.description] : []),  // Use description as fallback
        cookings_time: analysisResult.cookings_time || null,
        servings: analysisResult.servings || 1,
        difficulty: analysisResult.difficulty || 'medium',
        calories: analysisResult.calories || null,
        image_url: analysisResult.image_url || null,  // Include image URL
      };
      
      console.log('Sending recipe data with user_id:', recipeData.user_id);
      console.log('Recipe data object:', JSON.stringify(recipeData, null, 2));
      
      console.log('Making request to save recipe...');
      
      // Call API to save recipe and add to favorites
      const response = await fetch(`${API_URL}/api/favorites/save-ai-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (response.ok) {
        Alert.alert('Success', 'Recipe added to favorites!');
        setShowResultModal(false);
      } else {
        Alert.alert('Error', result.detail || result.error || 'Unable to save recipe.');
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
      Alert.alert('Error', 'Unable to save to favorites. Please try again.');
    } finally {
      setIsSavingFavorite(false);
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
            <Text style={styles.analyzingText}>Analyzing...</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
            disabled={isDetecting || isAnalyzing}>
            <Rotate3D size={20} color="#4CAF50" />
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickButton}
            onPress={handlePickImage}
            disabled={isDetecting || isAnalyzing}>
            <ImageIcon size={20} color="#4CAF50" />
            <Text style={styles.pickButtonText}>Pick Image</Text>
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
              {isDetecting ? 'Taking photo...' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowResultModal(false)}>
              <X size={24} color="#666666" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {analysisResult && (
                <>
                  {/* Display Image */}
                  {analysisResult.image_url && (
                    <Image 
                      source={{ uri: analysisResult.image_url }} 
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  <Text style={styles.modalTitle}>
                    {analysisResult.name}
                    {analysisResult.name_local && (
                      <Text style={styles.modalTitleLocal}> ({analysisResult.name_local})</Text>
                    )}
                  </Text>
                  
                  {analysisResult.description && (
                    <Text style={styles.modalDescription}>{analysisResult.description}</Text>
                  )}
                  
                  {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                    <View style={styles.modalIngredientsSection}>
                      <Text style={styles.modalSectionTitle}>Ingredients:</Text>
                      {analysisResult.ingredients.map((ing: string, index: number) => (
                        <Text key={index} style={styles.modalIngredientItem}>
                          • {ing}
                        </Text>
                      ))}
                    </View>
                  )}

                  {analysisResult.instructions && analysisResult.instructions.length > 0 && (
                    <View style={styles.modalInstructionsSection}>
                      <Text style={styles.modalSectionTitle}>Instructions:</Text>
                      {analysisResult.instructions.map((step: string, index: number) => (
                        <Text key={index} style={styles.modalInstructions}>
                          {index + 1}. {step}
                        </Text>
                      ))}
                    </View>
                  )}

                  {analysisResult.cookings_time && (
                    <Text style={styles.modalInfo}>
                      ⏱️ Cooking time: {analysisResult.cookings_time} minutes
                    </Text>
                  )}

                  {analysisResult.servings && (
                    <Text style={styles.modalInfo}>
                      👥 Servings: {analysisResult.servings}
                    </Text>
                  )}

                  {analysisResult.calories && (
                    <Text style={styles.modalInfo}>
                      🔥 Calories: {analysisResult.calories} kcal
                    </Text>
                  )}

                  {analysisResult.difficulty && (
                    <Text style={styles.modalInfo}>
                      📊 Difficulty: {analysisResult.difficulty}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.favoriteButton, isSavingFavorite && styles.favoriteButtonDisabled]}
              onPress={handleAddToFavorite}
              disabled={isSavingFavorite}>
              {isSavingFavorite ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.favoriteButtonText}>Add to Favorite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    paddingRight: 32,
  },
  modalTitleLocal: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666666',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalIngredientsSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  modalIngredientItem: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
    lineHeight: 20,
  },
  modalInstructionsSection: {
    marginBottom: 16,
  },
  modalInstructions: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    marginBottom: 4,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  favoriteButtonDisabled: {
    opacity: 0.6,
  },
  favoriteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

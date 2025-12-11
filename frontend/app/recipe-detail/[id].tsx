import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';
import { API_URL } from '@/config/api';
import { supabase } from '@/lib/supabase'; // Import Supabase client
import { useAuth } from '@/context/AuthContext'; // Import AuthContext

type Ingredient = {
  id: number;
  name: string;
  original: string;
  amount?: number;
  unit?: string;
  image?: string;
};

type RecipeDetail = {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: Ingredient[];
  missedIngredients: Ingredient[];
  unusedIngredients: Ingredient[];
  instructions: Array<{
    number: number;
    step: string;
  }>;
};

export default function RecipeDetailScreen() {
  const { id, recipe } = useLocalSearchParams<{ id: string; recipe: string }>();
  const router = useRouter();
  const { user } = useAuth(); // Get current user from auth context
  const [isFavorite, setIsFavorite] = useState(false);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && recipe) {
      try {
        const parsedRecipe = JSON.parse(recipe);
        console.log('Received Recipe Data:', JSON.stringify(parsedRecipe, null, 2));
        
        console.log('Used Ingredients:', parsedRecipe.usedIngredients);
        console.log('Missed Ingredients:', parsedRecipe.missedIngredients);
        console.log('Unused Ingredients:', parsedRecipe.unusedIngredients);

        fetchRecipeInstructions(parsedRecipe);
      } catch (err) {
        console.error('Error parsing recipe:', err);
        setError('Invalid recipe data');
        setIsLoading(false);
      }
    }
  }, [id, recipe]);

  // Sử dụng useEffect riêng cho việc kiểm tra trạng thái yêu thích khi recipeDetail hoặc user thay đổi
  useEffect(() => {
    if (recipeDetail && user) {
      console.log('useEffect: Checking if favorite for recipe:', recipeDetail.title, 'user:', user.id);
      checkIfFavorite(recipeDetail.title, recipeDetail.image);
    } else if (!user) {
      console.log('useEffect: User logged out or not available, resetting isFavorite to false.');
      setIsFavorite(false); // Reset favorite status if user logs out
    }
  }, [recipeDetail, user]);

  const checkIfFavorite = async (recipeTitle: string, recipeImage: string) => {
    if (!user || !recipeDetail) {
      console.log('checkIfFavorite: User or recipeDetail not available. Setting isFavorite to false.');
      setIsFavorite(false);
      return;
    }

    console.log('checkIfFavorite: Attempting to find recipe in DB by name and image_url...');
    // Bước 1: Tìm ID của món ăn trong bảng 'recipes' dựa vào tên và hình ảnh
    const { data: recipeDataInDb, error: recipeFetchError } = await supabase
      .from('recipes')
      .select('id')
      .eq('name', recipeTitle)
      .eq('image_url', recipeImage); 

    if (recipeFetchError) {
      console.error('checkIfFavorite: Error checking recipe in DB:', recipeFetchError.message);
      setIsFavorite(false);
      return;
    }

    if (!recipeDataInDb || recipeDataInDb.length === 0) {
      console.log('checkIfFavorite: Recipe not found in our DB. Setting isFavorite to false.');
      setIsFavorite(false); 
      return;
    }

    const recipeDbId = recipeDataInDb[0].id;
    console.log('checkIfFavorite: Found recipe in DB with ID:', recipeDbId);

    // Bước 2: Kiểm tra xem món ăn này có trong danh sách yêu thích của người dùng hiện tại không
    console.log('checkIfFavorite: Checking favorites table for user:', user.id, 'recipe:', recipeDbId);
    const { data: favoriteData, error: favoriteFetchError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeDbId);

    if (favoriteFetchError) {
      console.error('checkIfFavorite: Error checking favorite status in favorites table:', favoriteFetchError.message);
      setIsFavorite(false);
      return;
    }

    const isCurrentlyFavorite = favoriteData && favoriteData.length > 0;
    console.log('checkIfFavorite: Is recipe currently a favorite?', isCurrentlyFavorite);
    setIsFavorite(isCurrentlyFavorite);
  };


  const mapIngredients = (ingredients: any[]): Ingredient[] => {
    return (ingredients || []).map((ing: any) => ({
      id: ing.id || 0,
      name: ing.name || ing.localizedName || '',
      original: ing.original || ing.originalName || `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim(),
      amount: ing.amount,
      unit: ing.unit || ing.unitShort,
      image: ing.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ing.image}` : '', // Ensure image URL is complete
    }));
  };

  const fetchRecipeInstructions = async (recipeData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const mappedRecipe: RecipeDetail = {
        id: recipeData.id || Number(id),
        title: recipeData.title || 'Untitled Recipe',
        image: recipeData.image || '',
        usedIngredientCount: recipeData.usedIngredientCount || 0,
        missedIngredientCount: recipeData.missedIngredientCount || 0,
        usedIngredients: mapIngredients(recipeData.usedIngredients),
        missedIngredients: mapIngredients(recipeData.missedIngredients),
        unusedIngredients: mapIngredients(recipeData.unusedIngredients),
        instructions: [], // Initialize empty, will be filled from separate API
      };

      console.log('Ingredients from recipe list:', JSON.stringify(mappedRecipe, null, 2));

      // Now fetch instructions
      const response = await fetch(
        `${API_URL}/api/external/recipes/${id}/instructions`
      );

      let instructionsData: any = null;
      
      try {
        if (response.ok) {
          instructionsData = await response.json();
          console.log('Instructions API Response:', JSON.stringify(instructionsData, null, 2));
        } else {
          console.warn(`Instructions API returned status ${response.status} for instructions.`);
        }
      } catch (parseError) {
        console.error('Error parsing instructions response:', parseError);
        instructionsData = null;
      }

      let steps: any[] = [];

      if (instructionsData) {
        if (Array.isArray(instructionsData) && instructionsData.length > 0) {
          const recipeInstructions = instructionsData[0];
          if (recipeInstructions?.steps && Array.isArray(recipeInstructions.steps)) {
            steps = recipeInstructions.steps;
          }
        } else if (instructionsData.steps && Array.isArray(instructionsData.steps)) {
          steps = instructionsData.steps;
        }
      }

      console.log('Extracted Steps:', JSON.stringify(steps, null, 2));

      if (steps.length === 0) {
        console.warn('No instructions from API for this recipe.');
      }

      mappedRecipe.instructions = steps.map((instruction: any) => ({
        number: instruction.number || 0,
        step: instruction.step || instruction.text || instruction.instruction || '',
      }));

      console.log('Complete Recipe Detail:', JSON.stringify(mappedRecipe, null, 2));
      setRecipeDetail(mappedRecipe);
    } catch (error) {
      console.error('Error fetching recipe detail:', error);
      setError('Failed to load recipe details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToFavorite = async () => {
    if (!user) {
      Alert.alert('Please Login', 'You need to login to save recipes to favorites.');
      return;
    }

    if (!recipeDetail) {
      Alert.alert('Error', 'Recipe data not available');
      return;
    }

    setIsSaving(true);
    console.log('handleAddToFavorite: Starting favorite action...');

    try {
      let recipeDbId: string | null = null; // recipeDbId sẽ là UUID

      // Bước 1: Tìm ID của món ăn trong bảng 'recipes' dựa vào tên và hình ảnh
      console.log('handleAddToFavorite: Checking for existing recipe in DB by name and image_url...');
      const { data: existingRecipeData, error: fetchRecipeError } = await supabase
        .from('recipes')
        .select('id')
        .eq('name', recipeDetail.title)
        .eq('image_url', recipeDetail.image);
      
      if (fetchRecipeError && fetchRecipeError.code !== 'PGRST116') { // PGRST116: No rows found, which is fine
        console.error('handleAddToFavorite: Failed to check existing recipe:', fetchRecipeError.message);
        throw new Error(`Failed to check existing recipe: ${fetchRecipeError.message}`);
      }

      if (existingRecipeData && existingRecipeData.length > 0) {
        recipeDbId = existingRecipeData[0].id;
        console.log('handleAddToFavorite: Recipe already exists in DB with ID:', recipeDbId);
      } else {
        // Nếu món ăn chưa có trong database, chèn mới
        console.log('handleAddToFavorite: Recipe not found in DB, inserting new recipe...');
        const allIngredients = [
          ...recipeDetail.usedIngredients.map(ing => ing.original),
          ...recipeDetail.missedIngredients.map(ing => ing.original),
          ...recipeDetail.unusedIngredients.map(ing => ing.original),
        ];
        const instructions = recipeDetail.instructions.map(inst => inst.step);

        const description = `Match: ${recipeDetail.usedIngredientCount} ingredients used, ${recipeDetail.missedIngredientCount} missing.`;
        const cookings_time = 30; // Default to 30 mins
        const servings = 2; // Default to 2 servings
        const calories = 0; // Default to 0
        const difficulty = 'medium'; // Default to medium
        const imageUrl = recipeDetail.image || `https://ubktyiuetwoodibjhvxy.supabase.co/storage/v1/object/public/recipe-images/default_recipe.jpeg`;

        const { data: newRecipeData, error: recipeInsertError } = await supabase
          .from('recipes')
          .insert([
            {
              name: recipeDetail.title,
              image_url: imageUrl,
              description: description,
              cookings_time: cookings_time, // Sử dụng tên cột đúng
              servings: servings,
              calories: calories,
              difficulty: difficulty,
              ingredients: JSON.stringify(allIngredients), // Chuyển mảng thành chuỗi JSON
              instructions: JSON.stringify(instructions), // Chuyển mảng thành chuỗi JSON
            },
          ])
          .select('id')
          .single();

        if (recipeInsertError) {
          console.error('handleAddToFavorite: FAILED to save new recipe. Error details:', recipeInsertError);
          throw new Error(`Failed to save new recipe: ${recipeInsertError.message}`);
        }
        recipeDbId = newRecipeData.id;
        console.log('handleAddToFavorite: New recipe saved to DB with ID:', recipeDbId);
      }

      // Bước 2: Thêm hoặc xóa khỏi bảng 'favorites'
      if (!recipeDbId) {
        console.error('handleAddToFavorite: Could not get internal recipe ID after step 1. Aborting favorite action.');
        throw new Error('Could not get internal recipe ID.');
      }

      if (isFavorite) {
        // Người dùng muốn xóa khỏi mục yêu thích
        console.log('handleAddToFavorite: Recipe is currently favorite, attempting to REMOVE from favorites table...');
        const { error: removeError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeDbId);

        if (removeError) {
          console.error('handleAddToFavorite: FAILED to remove from favorites. Error details:', removeError);
          throw new Error(`Failed to remove from favorites: ${removeError.message}`);
        }
        setIsFavorite(false);
        Alert.alert('Success', 'Recipe removed from favorites!');
        console.log('handleAddToFavorite: Successfully REMOVED from favorites.');
      } else {
        // Người dùng muốn thêm vào mục yêu thích
        console.log('handleAddToFavorite: Recipe is NOT favorite, attempting to ADD to favorites table...');
        const { data: existingFavorite, error: checkFavoriteError } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', recipeDbId);

        if (checkFavoriteError) {
          console.error('handleAddToFavorite: Error checking if favorite already exists BEFORE ADD:', checkFavoriteError.message);
          throw checkFavoriteError;
        }

        if (existingFavorite && existingFavorite.length > 0) {
          Alert.alert('Already Favorited', 'This recipe is already in your favorites!');
          setIsFavorite(true); 
          console.log('handleAddToFavorite: Recipe already in favorites (found before add attempt).');
          return;
        }

        const { error: favoriteError } = await supabase
          .from('favorites')
          .insert([
            {
              user_id: user.id,
              recipe_id: recipeDbId,
            },
          ]);

        if (favoriteError) {
          console.error('handleAddToFavorite: FAILED to add to favorites. Error details:', favoriteError);
          throw new Error(`Failed to add to favorites: ${favoriteError.message}`);
        }
        setIsFavorite(true);
        Alert.alert('Success', 'Recipe added to favorites!');
        console.log('handleAddToFavorite: Successfully ADDED to favorites.');
      }

    } catch (error) {
      console.error('handleAddToFavorite: Caught error during favorite action:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to perform favorite action'
      );
    } finally {
      setIsSaving(false);
      // Re-check favorite status to ensure UI is consistent
      if (recipeDetail) {
        console.log('handleAddToFavorite: Re-checking favorite status after action...');
        checkIfFavorite(recipeDetail.title, recipeDetail.image);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipeDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchRecipeInstructions(JSON.parse(recipe || '{}'))}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const IngredientCard = ({ ingredient, type }: { ingredient: Ingredient; type: 'used' | 'missed' | 'unused' }) => {
    const getTypeInfo = () => {
      switch (type) {
        case 'used':
          return { icon: CheckCircle, color: '#4CAF50', bgColor: '#E8F5E9', label: 'Have' };
        case 'missed':
          return { icon: AlertCircle, color: '#FF9800', bgColor: '#FFF3E0', label: 'Need to Buy' };
        case 'unused':
          return { icon: XCircle, color: '#9E9E9E', bgColor: '#F5F5F5', label: 'Not Needed' };
      }
    };

    const typeInfo = getTypeInfo();
    const Icon = typeInfo.icon;

    return (
      <View style={[styles.ingredientCard, { backgroundColor: typeInfo.bgColor, borderLeftColor: typeInfo.color }]}>
        <View style={styles.ingredientCardHeader}>
          {ingredient.image ? (
            <Image 
              source={{ uri: ingredient.image }} 
              style={styles.ingredientImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.ingredientImagePlaceholder, { backgroundColor: typeInfo.color + '30' }]}>
              <Icon size={20} color={typeInfo.color} />
            </View>
          )}
          <View style={styles.ingredientCardContent}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            {/* FIX: Chỉ render Text component nếu ingredient.original có giá trị sau khi trim */}
            {/* Further guard against non-string types and empty/whitespace only content */}
            {typeof ingredient.original === 'string' && ingredient.original.trim() ? (
              <Text style={styles.ingredientOriginal} numberOfLines={2}>
                {ingredient.original.trim()}
              </Text>
            ) : null}
            {ingredient.amount !== undefined && ingredient.amount !== null && typeof ingredient.unit === 'string' && ingredient.unit.trim() ? (
              <Text style={styles.ingredientAmount}>
                {String(ingredient.amount)} {ingredient.unit.trim()}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.ingredientBadge, { backgroundColor: typeInfo.color }]}>
          <Text style={styles.ingredientBadgeText}>{typeInfo.label}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <TouchableOpacity onPress={handleAddToFavorite}>
          <Heart
            size={28}
            color={isFavorite ? '#FFFFFF' : '#FFE0CC'}
            fill={isFavorite ? '#FFFFFF' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {recipeDetail.image && (
          <Image
            source={{ uri: recipeDetail.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{recipeDetail.title}</Text>
            <View style={styles.ingredientStats}>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>✓ {recipeDetail.usedIngredientCount} Matched</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>✕ {recipeDetail.missedIngredientCount} Missing</Text>
              </View>
            </View>
          </View>

          {/* Used Ingredients Section */}
          {recipeDetail.usedIngredients && recipeDetail.usedIngredients.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✓ Ingredients You Have ({recipeDetail.usedIngredients.length})</Text>
              <View style={styles.ingredientsList}>
                {recipeDetail.usedIngredients.map((ingredient, index) => (
                  <IngredientCard key={index} ingredient={ingredient} type="used" />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No ingredients you have</Text>
            </View>
          )}

          {/* Missed Ingredients Section */}
          {recipeDetail.missedIngredients && recipeDetail.missedIngredients.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✕ Ingredients to Buy ({recipeDetail.missedIngredients.length})</Text>
              <View style={styles.ingredientsList}>
                {recipeDetail.missedIngredients.map((ingredient, index) => (
                  <IngredientCard key={index} ingredient={ingredient} type="missed" />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No missing ingredients</Text>
            </View>
          )}

          {/* Unused Ingredients Section */}
          {recipeDetail.unusedIngredients && recipeDetail.unusedIngredients.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⊘ Not Needed ({recipeDetail.unusedIngredients.length})</Text>
              <View style={styles.ingredientsList}>
                {recipeDetail.unusedIngredients.map((ingredient, index) => (
                  <IngredientCard key={index} ingredient={ingredient} type="unused" />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No unused ingredients</Text>
            </View>
          )}

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions ({recipeDetail.instructions.length} steps)</Text>
            {recipeDetail.instructions && recipeDetail.instructions.length > 0 ? (
              <View style={styles.instructionsList}>
                {recipeDetail.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>
                        {instruction.number}
                      </Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction.step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noInstructionsContainer}>
                <Text style={styles.noInstructionsText}>No instructions available</Text>
              </View>
            )}
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.addToFavoriteButton, isSaving && styles.buttonDisabled]} 
          onPress={handleAddToFavorite}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Heart size={20} color="#FFFFFF" fill={isFavorite ? '#FFFFFF' : 'transparent'} />
              <Text style={styles.addToFavoriteText}>{isFavorite ? 'Remove From Favorite' : 'Add To Favorite'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF8C42',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E8F5E9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 12,
    lineHeight: 32,
  },
  ingredientStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 12,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C42',    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  ingredientImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  ingredientImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientCardContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: 4,
  },
  ingredientOriginal: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: 11,
    color: '#FF8C42',
    fontWeight: '600',
  },
  ingredientBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ingredientBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    color: '#3D5245',
    flex: 1,
    lineHeight: 22,
  },
  noInstructionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noInstructionsText: {
    fontSize: 14,
    color: '#95A99C',
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  addToFavoriteButton: {    backgroundColor: '#FF8C42',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToFavoriteText: {    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#95A99C',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
});

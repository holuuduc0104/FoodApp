import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';
import { API_URL } from '@/config/api';

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && recipe) {
      try {
        const parsedRecipe = JSON.parse(recipe);
        console.log('Received Recipe Data:', JSON.stringify(parsedRecipe, null, 2));
        
        // Debug: Check if ingredients exist
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

  const mapIngredients = (ingredients: any[]): Ingredient[] => {
    return (ingredients || []).map((ing: any) => ({
      id: ing.id || 0,
      name: ing.name || ing.localizedName || '',
      original: ing.original || ing.originalName || `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim(),
      amount: ing.amount,
      unit: ing.unit || ing.unitShort,
      image: ing.image || '',
    }));
  };

  const fetchRecipeInstructions = async (recipeData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // First, map the ingredients from the recipe data passed from list
      const mappedRecipe: RecipeDetail = {
        id: recipeData.id || Number(id),
        title: recipeData.title || 'Untitled Recipe',
        image: recipeData.image || '',
        usedIngredientCount: recipeData.usedIngredientCount || 0,
        missedIngredientCount: recipeData.missedIngredientCount || 0,
        usedIngredients: mapIngredients(recipeData.usedIngredients),
        missedIngredients: mapIngredients(recipeData.missedIngredients),
        unusedIngredients: mapIngredients(recipeData.unusedIngredients),
        instructions: [],
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
        }
      } catch (parseError) {
        console.error('Error parsing instructions response:', parseError);
        instructionsData = null;
      }

      let steps: any[] = [];

      // Extract steps from API response
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

      // If no steps from API, use generic mock (optional)
      if (steps.length === 0) {
        console.warn('No instructions from API');
        steps = [];
      }

      // Update recipe with instructions
      mappedRecipe.instructions = steps.map((instruction: any) => ({
        number: instruction.number || 0,
        step: instruction.step || '',
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
      <View style={[styles.ingredientCard, { backgroundColor: typeInfo.bgColor }]}>
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
            <Text style={styles.ingredientOriginal} numberOfLines={2}>{ingredient.original}</Text>
            {ingredient.amount && ingredient.unit && (
              <Text style={styles.ingredientAmount}>
                {ingredient.amount} {ingredient.unit}
              </Text>
            )}
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
        <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
          <Heart
            size={28}
            color={isFavorite ? '#FFFFFF' : '#FFE0CC'}
            fill={isFavorite ? '#FFFFFF' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        {recipeDetail.image && (
          <Image
            source={{ uri: recipeDetail.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
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
        <TouchableOpacity style={styles.startCookingButton} activeOpacity={0.8}>
          <Text style={styles.startCookingText}>Start Cooking</Text>
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
    borderLeftColor: '#FF8C42',
    shadowColor: '#000',
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
  startCookingButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startCookingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  debugSection: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  debugText: {
    fontSize: 12,
    color: '#C62828',
    marginVertical: 2,
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

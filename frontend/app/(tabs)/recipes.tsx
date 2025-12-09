import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChefHat } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

type Recipe = {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients?: Array<any>;
  missedIngredients?: Array<any>;
  unusedIngredients?: Array<any>;
};

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const matchPercentage = Math.round(
    (recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100
  );

  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return '#4CAF50';
    if (percentage >= 40) return '#FF9800';
    return '#F44336';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image 
        source={{ uri: recipe.image }} 
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>✓</Text>
            <Text style={styles.metaValue}>{recipe.usedIngredientCount}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>✕</Text>
            <Text style={styles.metaValue}>{recipe.missedIngredientCount}</Text>
          </View>
        </View>
        <View style={[styles.matchBadge, { backgroundColor: getMatchColor(matchPercentage) + '20' }]}>
          <ChefHat size={11} color={getMatchColor(matchPercentage)} />
          <Text style={[styles.matchText, { color: getMatchColor(matchPercentage) }]}>
            {matchPercentage}% Match
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesListScreen() {
  const router = useRouter();
  const { recipes } = useLocalSearchParams<{ recipes: string }>();
  
  // Parse and ensure it's an array
  let recipesData: Recipe[] = [];
  try {
    if (recipes) {
      const parsed = JSON.parse(recipes);
      console.log('Parsed recipes from params:', JSON.stringify(parsed, null, 2));
      recipesData = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (error) {
    console.error('Error parsing recipes:', error);
  }

  const limitedRecipes = recipesData.slice(0, 10);

  const handleRecipePress = (recipe: Recipe) => {
    console.log('Selected recipe before navigation:', JSON.stringify(recipe, null, 2));
    router.push({
      pathname: `/recipe-detail/${recipe.id}`,
      params: { recipe: JSON.stringify(recipe) }
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Found Recipes</Text>
          <View style={{ width: 28 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          {limitedRecipes.length} recipes matched your ingredients
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {limitedRecipes.map((recipe: Recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onPress={() => handleRecipePress(recipe)} 
            />
          ))}
        </View>
        
        {limitedRecipes.length === 0 && (
          <View style={styles.emptyState}>
            <ChefHat size={48} color="#95A99C" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adding more ingredients</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF9',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FF8C42',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFE0CC',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: cardWidth,
    backgroundColor: '#E8F5E9',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8C42',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E0E0E0',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B4332',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A99C',
    marginTop: 4,
  },
});
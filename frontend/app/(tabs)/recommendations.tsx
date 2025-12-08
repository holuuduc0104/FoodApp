import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Users, ChefHat, Search, X } from 'lucide-react-native';
import { API_URL } from '@/config/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

type Dish = {
  id: string;
  title: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: string;
};

function DishCard({ dish, onPress }: { dish: Dish; onPress: () => void }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FF9800';
      case 'Hard':
        return '#F44336';
      default:
        return '#95A99C';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: dish.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {dish.title}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Clock size={12} color="#95A99C" />
            <Text style={styles.metaText}>{dish.cookTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={12} color="#95A99C" />
            <Text style={styles.metaText}>{dish.servings}</Text>
          </View>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(dish.difficulty) + '20' }]}>
          <ChefHat size={10} color={getDifficultyColor(dish.difficulty)} />
          <Text style={[styles.difficultyText, { color: getDifficultyColor(dish.difficulty) }]}>
            {dish.difficulty}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Dish[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recipes, setRecipes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recipes from database on mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      // Get all recipes from database
      const response = await fetch(`${API_URL}/api/recipes/`);
      
      if (!response.ok) {
        console.log(`API returned status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      // Check if data is an array
      if (!Array.isArray(data)) {
        console.log('Data is not an array, setting empty recipes');
        setRecipes([]);
        return;
      }
      
      // If no results, set empty
      if (data.length === 0) {
        console.log('No recipes found in database');
        setRecipes([]);
        return;
      }
      
      // Map API response to Dish format
      const mappedRecipes: Dish[] = data.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.name,
        image: recipe.image_url,
        cookTime: `${recipe.cookings_time} min`,
        servings: recipe.servings || 2,
        difficulty: recipe.difficulty || 'Medium',
      }));
      
      setRecipes(mappedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      // Set empty if API fails
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDishPress = (dish: Dish) => {
    router.push(`/recipe/${dish.id}` as any);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_URL}/api/recipes/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Search Response:', data); // Debug log
      
      // Check if data is an array
      if (!Array.isArray(data)) {
        console.log('Search data is not an array');
        setSearchResults([]);
        setShowSearchResults(true);
        return;
      }
      
      // Map API response to Dish format
      const mappedResults: Dish[] = data.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.name,
        image: recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        cookTime: `${recipe.cookings_time} min`,
        servings: recipe.servings || 2,
        difficulty: recipe.difficulty || 'Medium',
      }));
      
      setSearchResults(mappedResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      // Set empty results if search fails
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const displayedDishes = showSearchResults ? searchResults : recipes;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommended Dishes</Text>
        <Text style={styles.headerSubtitle}>Based on your selected ingredients</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#95A99C" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm món ăn..."
              placeholderTextColor="#95A99C"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <X size={20} color="#95A99C" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>Tìm</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {showSearchResults && (
          <Text style={styles.searchResultText}>
            {searchResults.length > 0 
              ? `Tìm thấy ${searchResults.length} kết quả cho "${searchQuery}"`
              : `Không tìm thấy kết quả cho "${searchQuery}"`
            }
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2D6A4F" />
            <Text style={styles.loadingText}>Đang tải món ăn...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayedDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} onPress={() => handleDishPress(dish)} />
            ))}
          </View>
        )}
        {displayedDishes.length === 0 && !isSearching && !isLoading && (
          <View style={styles.emptyState}>
            <ChefHat size={48} color="#95A99C" />
            <Text style={styles.emptyText}>Không có món ăn nào</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF9',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#95A99C',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B4332',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultText: {
    fontSize: 12,
    color: '#95A99C',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A99C',
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#95A99C',
    marginTop: 12,
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
    height: 120,
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
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 11,
    color: '#95A99C',
    marginLeft: 4,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
});

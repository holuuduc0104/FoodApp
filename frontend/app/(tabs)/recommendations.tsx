import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Users, ChefHat, Search, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const API_URL = 'http://192.168.1.109:8000'; // Update with your backend IP

// Mock dish data
const mockDishes = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
    cookTime: '30 min',
    servings: 4,
    difficulty: 'Medium',
  },
  {
    id: '2',
    title: 'Grilled Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    cookTime: '25 min',
    servings: 2,
    difficulty: 'Easy',
  },
  {
    id: '3',
    title: 'Caesar Salad',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
    cookTime: '15 min',
    servings: 2,
    difficulty: 'Easy',
  },
  {
    id: '4',
    title: 'Beef Stir Fry',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    cookTime: '20 min',
    servings: 3,
    difficulty: 'Medium',
  },
  {
    id: '5',
    title: 'Mushroom Risotto',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop',
    cookTime: '45 min',
    servings: 4,
    difficulty: 'Hard',
  },
  {
    id: '6',
    title: 'Chicken Curry',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
    cookTime: '40 min',
    servings: 4,
    difficulty: 'Medium',
  },
];

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
      const data = await response.json();
      
      // Map API response to Dish format
      const mappedResults: Dish[] = data.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.name,
        image: recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        cookTime: `${recipe.cooking_time} min`,
        servings: 4,
        difficulty: recipe.difficulty || 'Medium',
      }));
      
      setSearchResults(mappedResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search in mockDishes
      const filtered = mockDishes.filter(dish => 
        dish.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
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

  const displayedDishes = showSearchResults ? searchResults : mockDishes;

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
        <View style={styles.grid}>
          {displayedDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} onPress={() => handleDishPress(dish)} />
          ))}
        </View>
        {displayedDishes.length === 0 && !isSearching && (
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

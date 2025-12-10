import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, Users, ChefHat, Heart, ArrowLeft, Trash2 } from 'lucide-react-native';
import { API_URL } from '@/config/api';
import { supabase } from '../supabase';

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

function DishCard({ dish, onPress, onDelete }: { dish: Dish; onPress: () => void; onDelete: () => void }) {
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
      <Image 
        source={{ uri: dish.image }} 
        style={styles.cardImage}
        resizeMode="cover"
      />
      
      {/* Delete button */}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color="#FFFFFF" />
      </TouchableOpacity>
      
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

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchFavorites(session.user.id);
      } else {
        Alert.alert('Not Logged In', 'Please login to view your favorites');
        router.back();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      Alert.alert('Error', 'Unable to verify authentication');
      router.back();
    }
  };

  const fetchFavorites = async (uid: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/favorites/?user_id=${uid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Favorites data:', data);
      
      if (!Array.isArray(data)) {
        console.log('Data is not an array, setting empty favorites');
        setFavorites([]);
        return;
      }
      
      if (data.length === 0) {
        console.log('No favorites found');
        setFavorites([]);
        return;
      }
      
      // Map API response to Dish format
      const mappedFavorites: Dish[] = data.map((item: any) => ({
        id: item.recipe_id,
        title: item.recipes.name,
        image: item.recipes.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        cookTime: `${item.recipes.cookings_time} min`,
        servings: item.recipes.servings || 2,
        difficulty: item.recipes.difficulty || 'Medium',
      }));
      
      console.log('Mapped favorites:', mappedFavorites);
      
      setFavorites(mappedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Unable to load favorites');
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFavorite = async (favoriteId: string, recipeName: string) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${recipeName}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/favorites/${favoriteId}?user_id=${userId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                // Remove from local state
                setFavorites(prev => prev.filter(dish => dish.id !== favoriteId));
                Alert.alert('Success', 'Removed from favorites');
              } else {
                throw new Error('Failed to delete');
              }
            } catch (error) {
              console.error('Error deleting favorite:', error);
              Alert.alert('Error', 'Unable to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const handleDishPress = (dish: Dish) => {
    router.push(`/recipe/${dish.id}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1B4332" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Recipes</Text>
        <View style={styles.headerRight}>
          <Heart size={24} color="#FF6B6B" fill="#FF6B6B" />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2D6A4F" />
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color="#95A99C" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Start adding recipes to your favorites!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onPress={() => handleDishPress(dish)}
                onDelete={() => handleDeleteFavorite(dish.id, dish.title)}
              />
            ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4332',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4332',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#95A99C',
    textAlign: 'center',
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
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
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
    textTransform: 'capitalize',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Users, ChefHat, Flame, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Mock recipe detail data
const mockRecipeDetails: Record<string, {
  id: string;
  title: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: string;
  calories: number;
  description: string;
  ingredients: string[];
  instructions: string[];
}> = {
  '1': {
    id: '1',
    title: 'Spaghetti Carbonara',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=600&fit=crop',
    cookTime: '30 min',
    servings: 4,
    difficulty: 'Medium',
    calories: 450,
    description: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper. Creamy, rich, and absolutely delicious.',
    ingredients: [
      '400g spaghetti',
      '200g pancetta or guanciale',
      '4 large egg yolks',
      '100g Pecorino Romano cheese',
      '50g Parmesan cheese',
      'Freshly ground black pepper',
      'Salt to taste',
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
      'While pasta cooks, cut pancetta into small cubes and fry in a large pan until crispy.',
      'In a bowl, whisk together egg yolks, grated Pecorino, and Parmesan cheese.',
      'When pasta is al dente, reserve 1 cup of pasta water, then drain.',
      'Add hot pasta to the pancetta pan (off heat) and toss to coat.',
      'Quickly add the egg mixture, tossing constantly. Add pasta water as needed for creaminess.',
      'Season generously with black pepper and serve immediately.',
    ],
  },
  '2': {
    id: '2',
    title: 'Grilled Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop',
    cookTime: '25 min',
    servings: 2,
    difficulty: 'Easy',
    calories: 350,
    description: 'Perfectly grilled salmon with a crispy skin and tender, flaky interior. Simple yet elegant.',
    ingredients: [
      '2 salmon fillets (6 oz each)',
      '2 tbsp olive oil',
      '1 lemon, sliced',
      '2 cloves garlic, minced',
      'Fresh dill',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Preheat grill or grill pan to medium-high heat.',
      'Pat salmon fillets dry and brush with olive oil.',
      'Season generously with salt, pepper, and minced garlic.',
      'Place salmon skin-side down on the grill.',
      'Cook for 4-5 minutes per side until internal temperature reaches 145°F.',
      'Garnish with fresh dill and lemon slices before serving.',
    ],
  },
  '3': {
    id: '3',
    title: 'Caesar Salad',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop',
    cookTime: '15 min',
    servings: 2,
    difficulty: 'Easy',
    calories: 280,
    description: 'A timeless classic with crisp romaine lettuce, creamy Caesar dressing, crunchy croutons, and parmesan.',
    ingredients: [
      '1 large head romaine lettuce',
      '1/2 cup Caesar dressing',
      '1/2 cup croutons',
      '1/4 cup shaved Parmesan cheese',
      'Freshly ground black pepper',
      'Anchovy fillets (optional)',
    ],
    instructions: [
      'Wash and dry romaine lettuce, then tear into bite-sized pieces.',
      'Place lettuce in a large salad bowl.',
      'Add Caesar dressing and toss to coat evenly.',
      'Top with croutons and shaved Parmesan cheese.',
      'Add anchovy fillets if desired and season with black pepper.',
      'Serve immediately while croutons are still crunchy.',
    ],
  },
  '4': {
    id: '4',
    title: 'Beef Stir Fry',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop',
    cookTime: '20 min',
    servings: 3,
    difficulty: 'Medium',
    calories: 380,
    description: 'Quick and flavorful beef stir fry with colorful vegetables in a savory sauce.',
    ingredients: [
      '500g beef sirloin, sliced thin',
      '2 cups mixed vegetables (bell peppers, broccoli, snap peas)',
      '3 tbsp soy sauce',
      '1 tbsp oyster sauce',
      '2 cloves garlic, minced',
      '1 tbsp ginger, minced',
      '2 tbsp vegetable oil',
    ],
    instructions: [
      'Slice beef against the grain into thin strips.',
      'Mix soy sauce and oyster sauce in a small bowl.',
      'Heat oil in a wok or large skillet over high heat.',
      'Add beef and stir fry for 2-3 minutes until browned. Remove and set aside.',
      'Add more oil if needed, then stir fry garlic and ginger for 30 seconds.',
      'Add vegetables and stir fry for 3-4 minutes until crisp-tender.',
      'Return beef to the wok, add sauce, and toss everything together.',
      'Serve hot over steamed rice.',
    ],
  },
  '5': {
    id: '5',
    title: 'Mushroom Risotto',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&h=600&fit=crop',
    cookTime: '45 min',
    servings: 4,
    difficulty: 'Hard',
    calories: 420,
    description: 'Creamy, luxurious Italian risotto with earthy mushrooms and Parmesan cheese.',
    ingredients: [
      '1.5 cups Arborio rice',
      '500g mixed mushrooms',
      '6 cups chicken or vegetable stock',
      '1 cup dry white wine',
      '1 onion, finely diced',
      '3 cloves garlic, minced',
      '1/2 cup Parmesan cheese, grated',
      '3 tbsp butter',
      'Fresh thyme',
    ],
    instructions: [
      'Heat stock in a saucepan and keep warm over low heat.',
      'Sauté mushrooms in butter until golden, then set aside.',
      'In a large pan, sauté onion until translucent, add garlic.',
      'Add rice and toast for 1-2 minutes, stirring constantly.',
      'Add wine and stir until absorbed.',
      'Add warm stock one ladle at a time, stirring frequently.',
      'Continue adding stock and stirring for about 18-20 minutes.',
      'Stir in mushrooms, Parmesan, and remaining butter.',
      'Season with salt, pepper, and fresh thyme.',
    ],
  },
  '6': {
    id: '6',
    title: 'Chicken Curry',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop',
    cookTime: '40 min',
    servings: 4,
    difficulty: 'Medium',
    calories: 390,
    description: 'A rich and aromatic chicken curry with warm spices and creamy coconut milk.',
    ingredients: [
      '600g chicken thighs, cubed',
      '1 can coconut milk',
      '2 tbsp curry powder',
      '1 onion, diced',
      '3 cloves garlic, minced',
      '1 tbsp ginger, minced',
      '2 tomatoes, diced',
      'Fresh cilantro',
      'Salt to taste',
    ],
    instructions: [
      'Season chicken with salt and half the curry powder.',
      'Brown chicken in a large pot, then remove and set aside.',
      'Sauté onion until soft, add garlic and ginger.',
      'Add remaining curry powder and toast for 1 minute.',
      'Add tomatoes and cook until softened.',
      'Pour in coconut milk and bring to a simmer.',
      'Return chicken to the pot and simmer for 20-25 minutes.',
      'Adjust seasoning and garnish with fresh cilantro.',
      'Serve with basmati rice or naan bread.',
    ],
  },
};

export default function RecipeDetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  const recipe = mockRecipeDetails[id] || mockRecipeDetails['1'];

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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} />
          <View style={styles.imageOverlay} />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Heart 
              size={24} 
              color={isFavorite ? '#F44336' : '#FFFFFF'} 
              fill={isFavorite ? '#F44336' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Clock size={20} color="#2D6A4F" />
              </View>
              <Text style={styles.statValue}>{recipe.cookTime}</Text>
              <Text style={styles.statLabel}>Cook Time</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Users size={20} color="#2D6A4F" />
              </View>
              <Text style={styles.statValue}>{recipe.servings}</Text>
              <Text style={styles.statLabel}>Servings</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Flame size={20} color="#2D6A4F" />
              </View>
              <Text style={styles.statValue}>{recipe.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: getDifficultyColor(recipe.difficulty) + '20' }]}>
                <ChefHat size={20} color={getDifficultyColor(recipe.difficulty)} />
              </View>
              <Text style={[styles.statValue, { color: getDifficultyColor(recipe.difficulty) }]}>
                {recipe.difficulty}
              </Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.startCookingButton} activeOpacity={0.8}>
          <Text style={styles.startCookingText}>Start Cooking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF9',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: -24,
    backgroundColor: '#F8FBF9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7C72',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#95A99C',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 16,
  },
  ingredientsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D6A4F',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 14,
    color: '#3D5245',
    flex: 1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startCookingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

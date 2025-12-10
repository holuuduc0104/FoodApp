import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Plus, X, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@/config/api';

// Define ingredient type
type Ingredient = {
  id: number;
  name: string;
};

// Define your navigation stack types
type RootStackParamList = {
  IngredientsInput: undefined;
  Recipes: { recipes: any[] }; // data từ backend
};

// type NavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   'IngredientsInput'
// >;

export default function IngredientsInputScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [popularIngredients, setPopularIngredients] = useState<Ingredient[]>(
    []
  );
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();

  // Fetch popular ingredients on mount
  useEffect(() => {
    fetchPopularIngredients();
  }, []);

  // Search ingredients in database with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchIngredientsInDB(searchQuery);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchPopularIngredients = async () => {
    try {
      setIsLoadingIngredients(true);
      // IDs của các popular ingredients (có thể config)
      const popularIds = [
        52, 71, 122, 128, 151, 185, 253, 296, 309, 310, 356, 518, 559, 601, 651,
        656, 707, 715, 723, 761, 767, 777, 797, 836, 895, 935, 1123, 1, 1185,
      ];

      const idsParam = popularIds.join(',');

      const response = await fetch(
        `${API_URL}/api/ingredients/popular?ids=${idsParam}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Popular ingredients loaded:', data);
      setPopularIngredients(data);
    } catch (error) {
      console.error('Error fetching popular ingredients:', error);
      // Fallback to default ingredients
      setPopularIngredients([
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Onion' },
        { id: 3, name: 'Garlic' },
        { id: 4, name: 'Carrot' },
        { id: 5, name: 'Potato' },
        { id: 6, name: 'Chicken' },
      ]);
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  const searchIngredientsInDB = async (query: string) => {
    try {
      setIsSearching(true);
      const response = await fetch(
        `${API_URL}/api/ingredients/search?query=${encodeURIComponent(query)}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search results:', data);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching ingredients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Thêm nguyên liệu vào tag list
  const handleAddIngredient = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedIngredients.includes(trimmed)) return; // tránh trùng
    setSelectedIngredients([...selectedIngredients, trimmed]);
    setManualInput('');
  };

  // Xóa nguyên liệu khỏi tag list
  const handleRemoveIngredient = (name: string) => {
    setSelectedIngredients(selectedIngredients.filter((ing) => ing !== name));
  };

  // Gửi danh sách nguyên liệu lên backend và navigate sang Recipes
  const handleFindRecipes = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No ingredients', 'Please add at least one ingredient.');
      return;
    }

    try {
      const ingredientsString = selectedIngredients.join(',');
      const url = `${API_URL}/api/external/recipes/by-ingredients?ingredients=${ingredientsString}&number=10`;

      console.log('Request URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      // Check if API returned error
      if (data.status === 'failure') {
        Alert.alert(
          'API Limit Reached',
          'Daily API limit exceeded. Please try again tomorrow or upgrade your plan.'
        );
        return;
      }

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('API response is not an array');
      }

      if (data.length === 0) {
        Alert.alert('No recipes', 'No recipes found for selected ingredients');
        return;
      }

      console.log(
        'First recipe with full data:',
        JSON.stringify(data[0], null, 2)
      );

      // Navigate with real API data
      router.push({
        pathname: '/(tabs)/recipes',
        params: { recipes: JSON.stringify(data) },
      });
    } catch (err) {
      console.error('Error:', err);
      Alert.alert(
        'Error',
        'Failed to fetch recipes. ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  // Display search results if searching, otherwise show popular ingredients
  const displayedIngredients = searchQuery.trim() ? searchResults : popularIngredients;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Ingredients</Text>
          <Text style={styles.subtitle}>Select or add ingredients</Text>
        </View>

        <View style={styles.content}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Manual Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Manual Input</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type ingredient name..."
                  value={manualInput}
                  onChangeText={setManualInput}
                  placeholderTextColor="#999999"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddIngredient(manualInput)}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Ingredients */}
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>
                {searchQuery.trim() ? 'Search Results' : 'Popular Ingredients'}
              </Text>
              <View style={styles.searchContainer}>
                <Search size={20} color="#999999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search ingredients in database..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999999"
                />
              </View>
            </View>

            {/* Selected Ingredient Tags */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginVertical: 12,
              }}
            >
              {selectedIngredients.map((item) => (
                <View
                  key={item}
                  style={{ ...styles.tag, marginRight: 8, marginBottom: 8 }}
                >
                  <Text style={styles.tagText}>{item || ''}</Text>
                  <TouchableOpacity
                    style={styles.tagRemoveBtn}
                    onPress={() => handleRemoveIngredient(item)}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Ingredients Grid */}
            {isLoadingIngredients || isSearching ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color="#FF8C42" />
                <Text style={{ color: '#999', marginTop: 8 }}>
                  {isSearching ? 'Searching...' : 'Loading ingredients...'}
                </Text>
              </View>
            ) : displayedIngredients.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ color: '#999', fontSize: 16 }}>
                  {searchQuery.trim() ? 'No ingredients found' : 'No popular ingredients'}
                </Text>
              </View>
            ) : (
              <View style={styles.ingredientsGrid}>
                {displayedIngredients.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.ingredientButton}
                    onPress={() => handleAddIngredient(item.name)}
                  >
                    <Text style={styles.ingredientButtonText}>{item.name || 'Unknown'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Find Recipes Button */}
            <TouchableOpacity
              style={styles.findButton}
              onPress={handleFindRecipes}
            >
              <Text style={styles.findButtonText}>Find Recipes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardAvoid: { flex: 1 },
  header: {
    backgroundColor: '#FF8C42',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#FFE0CC' },
  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 20 },
  inputSection: { marginBottom: 16 },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#FF8C42',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: { marginBottom: 16 },
  searchLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333333' },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  ingredientButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
  },
  ingredientButtonText: {
    color: '#FF8C42',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    position: 'relative',
  },
  tagText: { color: '#fff', fontWeight: '600', paddingRight: 18 },
  tagRemoveBtn: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#0003',
    borderRadius: 10,
    padding: 2,
  },
  findButton: {
    backgroundColor: '#FF8C42',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  findButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
});

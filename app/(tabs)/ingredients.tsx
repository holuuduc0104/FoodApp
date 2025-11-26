import React, { useState } from 'react';
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
} from 'react-native';
import { useIngredients } from '@/context/IngredientsContext';
import { Plus, X, Search } from 'lucide-react-native';

const POPULAR_INGREDIENTS = [
  'Tomato',
  'Onion',
  'Garlic',
  'Carrot',
  'Potato',
  'Chicken',
  'Beef',
  'Fish',
  'Rice',
  'Pasta',
  'Bell Pepper',
  'Broccoli',
  'Spinach',
  'Lettuce',
  'Cucumber',
  'Mushroom',
  'Cheese',
  'Milk',
  'Egg',
  'Bread',
];

export default function IngredientsInputScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualInput, setManualInput] = useState('');
  const { addIngredient } = useIngredients();

  const handleAddIngredient = (name: string) => {
    if (name.trim()) {
      addIngredient(name.trim());
      setManualInput('');
      Alert.alert(
        'Added!',
        `${name.trim()} has been added to your ingredients.`,
        [{ text: 'OK' }]
      );
    }
  };

  const filteredIngredients = POPULAR_INGREDIENTS.filter((ing) =>
    ing.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Ingredients</Text>
          <Text style={styles.subtitle}>Manually add or select from popular items</Text>
        </View>

        <View style={styles.content}>
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
                onPress={() => handleAddIngredient(manualInput)}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>Popular Ingredients</Text>
            <View style={styles.searchContainer}>
              <Search size={20} color="#999999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          <FlatList
            data={filteredIngredients}
            keyExtractor={(item) => item}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.ingredientButton}
                onPress={() => handleAddIngredient(item)}>
                <Text style={styles.ingredientButtonText}>{item}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FF8C42',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFE0CC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
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
  searchSection: {
    marginBottom: 16,
  },
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333333',
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  ingredientButton: {
    flex: 1,
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
});

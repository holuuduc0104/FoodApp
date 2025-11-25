import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Camera, ChefHat, X } from 'lucide-react-native';
import { useIngredients } from '@/context/IngredientsContext';

export default function HomeScreen() {
  const router = useRouter();
  const { ingredients, removeIngredient } = useIngredients();

  const handleRemoveIngredient = (id: string) => {
    removeIngredient(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ChefHat size={32} color="#2D6A4F" />
          <Text style={styles.headerTitle}>Smart Meal</Text>
        </View>
        <Text style={styles.headerSubtitle}>Recommendation</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Ingredients</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ingredients.length}</Text>
            </View>
          </View>

          {ingredients.length > 0 ? (
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{ingredient.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(ingredient.id)}
                    style={styles.removeButton}>
                    <X size={16} color="#2D6A4F" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No ingredients added yet</Text>
              <Text style={styles.emptySubtext}>
                Add ingredients to get meal recommendations
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.actionsSectionTitle}>Add More Ingredients</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => router.push('/ingredients')}>
            <View style={styles.buttonIcon}>
              <Plus size={24} color="#FFFFFF" />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Manual Input</Text>
              <Text style={styles.buttonSubtitle}>Type ingredients yourself</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/camera')}>
            <View style={styles.buttonIcon}>
              <Camera size={24} color="#FFFFFF" />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>AI Camera Detection</Text>
              <Text style={styles.buttonSubtitle}>Scan ingredients with camera</Text>
            </View>
          </TouchableOpacity>
        </View>

        {ingredients.length > 0 && (
          <TouchableOpacity style={styles.recommendButton}>
            <ChefHat size={24} color="#FFFFFF" />
            <Text style={styles.recommendButtonText}>Get Meal Recommendations</Text>
          </TouchableOpacity>
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
    backgroundColor: '#2D6A4F',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B8DCCF',
    marginTop: 4,
    marginLeft: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4332',
  },
  badge: {
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D6A4F',
  },
  removeButton: {
    padding: 2,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E9',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#95A99C',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B8C5BC',
    textAlign: 'center',
  },
  actionsSection: {
    marginTop: 32,
    marginBottom: 16,
  },
  actionsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#2D6A4F',
  },
  secondaryButton: {
    backgroundColor: '#FF8C42',
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 32,
    gap: 12,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  recommendButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

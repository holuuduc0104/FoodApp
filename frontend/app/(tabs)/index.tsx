import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Camera, ChefHat, X, LogOut } from 'lucide-react-native';
import { useIngredients } from '@/context/IngredientsContext';
import { supabase } from '@/supabase';
import { useEffect, useState } from 'react';


export default function HomeScreen() {
  const router = useRouter();
  const { ingredients, removeIngredient } = useIngredients();

  const [email, setEmail] = useState<string | null>(null);

  
  // Lấy thông tin user từ Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('../auth');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <ChefHat size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Smart Meal</Text>
          </View>



          
          {/* User info + logout */}
          {email && (
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{email}</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <LogOut size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
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
                    onPress={() => removeIngredient(ingredient.id)}
                    style={styles.removeButton}>
                    <X size={16} color="#2D6A4F" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No ingredients added yet</Text>
              <Text style={styles.emptySubtext}>Add ingredients to get meal recommendations</Text>
            </View>
          )}
        </View>

        {/* Add Ingredient Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsSectionTitle}>Add More Ingredients</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => router.push('/ingredients')}>
            <Plus size={24} color="#FFFFFF" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Manual Input</Text>
              <Text style={styles.buttonSubtitle}>Type ingredients yourself</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/camera')}>
            <Camera size={24} color="#FFFFFF" />
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
  container: { flex: 1, backgroundColor: '#F8FBF9' },

  header: {
    backgroundColor: '#2D6A4F',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  userEmail: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  logoutBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },

  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 24 },

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

  badgeText: { color: '#FFFFFF', fontWeight: '700' },

  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

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
    elevation: 2,
  },

  ingredientText: { fontSize: 15, fontWeight: '500', color: '#2D6A4F' },
  removeButton: { padding: 2 },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E9',
    borderStyle: 'dashed',
  },

  emptyText: { fontSize: 16, fontWeight: '600', color: '#95A99C' },
  emptySubtext: { fontSize: 14, color: '#B8C5BC', textAlign: 'center' },

  actionsSection: { marginTop: 32, marginBottom: 16 },
  actionsSectionTitle: { fontSize: 18, fontWeight: '600', color: '#1B4332', marginBottom: 16 },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    gap: 16,
  },

  primaryButton: { backgroundColor: '#2D6A4F' },
  secondaryButton: { backgroundColor: '#FF8C42' },

  buttonContent: { flex: 1 },

  buttonTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  buttonSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  recommendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 32,
    gap: 12,
  },

  recommendButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

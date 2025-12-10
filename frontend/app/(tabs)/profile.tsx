import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Settings, LogOut, Heart, Clock, ChevronRight } from 'lucide-react-native';
import { supabase } from "../../supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("guest@foodapp.com");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.replace('../auth'); // quay về index.tsx
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color="#2D6A4F" />
            </View>
          </View>

          <Text style={styles.name}>{userEmail.split("@")[0]}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>


        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Heart size={24} color="#FF8C42" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Clock size={24} color="#FF8C42" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Cooked</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <User size={20} color="#2D6A4F" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <ChevronRight size={20} color="#95A99C" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Settings size={20} color="#2D6A4F" />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <ChevronRight size={20} color="#95A99C" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/favorites')}
          >
            <View style={styles.menuItemLeft}>
              <Heart size={20} color="#2D6A4F" />
              <Text style={styles.menuItemText}>Favorite Recipes</Text>
            </View>
            <ChevronRight size={20} color="#95A99C" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Clock size={20} color="#2D6A4F" />
              <Text style={styles.menuItemText}>Cooking History</Text>
            </View>
            <ChevronRight size={20} color="#95A99C" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  <LogOut size={20} color="#FF4444" />
  <Text style={styles.logoutText}>Log Out</Text>
</TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
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
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2D6A4F',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#95A99C',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B4332',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#95A99C',
    marginTop: 4,
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1B4332',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF4444',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#95A99C',
  },
});

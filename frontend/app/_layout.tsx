import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { IngredientsProvider } from '@/context/IngredientsContext';
import { AuthProvider } from '../context/AuthContext'; // Điều chỉnh đường dẫn nếu cần

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider> {/* Thêm AuthProvider ở đây */}
      <IngredientsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </IngredientsProvider>
    </AuthProvider>
  );
}

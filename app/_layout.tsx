import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { IngredientsProvider } from '@/context/IngredientsContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <IngredientsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </IngredientsProvider>
  );
}

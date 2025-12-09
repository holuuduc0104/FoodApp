import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import RecipesScreen from './screens/RecipesScreen';
import IngredientsInputScreen from './app/(tabs)/ingredients';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="IngredientsInput" component={IngredientsInputScreen} />
        <Stack.Screen name="Recipes" component={RecipesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
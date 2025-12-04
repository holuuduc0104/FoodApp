import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Ingredient {
  id: string;
  name: string;
  addedAt: Date;
}

interface IngredientsContextType {
  ingredients: Ingredient[];
  addIngredient: (name: string) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
}

const IngredientsContext = createContext<IngredientsContextType | undefined>(undefined);

export function IngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const addIngredient = (name: string) => {
    const id = `${name}-${Date.now()}`;
    setIngredients((prev) => [
      ...prev,
      {
        id,
        name,
        addedAt: new Date(),
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const clearIngredients = () => {
    setIngredients([]);
  };

  return (
    <IngredientsContext.Provider
      value={{
        ingredients,
        addIngredient,
        removeIngredient,
        clearIngredients,
      }}>
      {children}
    </IngredientsContext.Provider>
  );
}

export function useIngredients() {
  const context = useContext(IngredientsContext);
  if (!context) {
    throw new Error('useIngredients must be used within IngredientsProvider');
  }
  return context;
}

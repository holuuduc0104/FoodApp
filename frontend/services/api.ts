// API Service for FoodApp

const API_BASE_URL = 'http://192.168.1.30:8000/api';

export interface AnalyzeFoodResponse {
  success: boolean;
  data: {
    dish_name?: string;
    dish_name_en?: string;
    confidence?: string;
    ingredients?: Array<{
      name: string;
      quantity: string;
      unit: string;
    }>;
    recipe?: {
      prep_time: string;
      cook_time: string;
      servings: string;
      difficulty: string;
      steps: string[];
    };
    nutrition?: {
      calories: string;
      protein: string;
      carbs: string;
      fat: string;
    };
    tips?: string[];
    description?: string;
    error?: string;
    suggestion?: string;
  };
}

export interface DetectIngredientsResponse {
  success: boolean;
  data: {
    ingredients: Array<{
      name: string;
      name_en: string;
      category: string;
      confidence: string;
    }>;
    total_count: number;
  };
}

/**
 * Analyze food image and get dish information with recipe
 */
export async function analyzeFoodImage(imageUri: string): Promise<AnalyzeFoodResponse> {
  try {
    const formData = new FormData();
    
    // Create file from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/ai/analyze-food`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw error;
  }
}

/**
 * Detect ingredients from image
 */
export async function detectIngredients(imageUri: string): Promise<DetectIngredientsResponse> {
  try {
    const formData = new FormData();
    
    // Create file from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/ai/detect-ingredients`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error detecting ingredients:', error);
    throw error;
  }
}

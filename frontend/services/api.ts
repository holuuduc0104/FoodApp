// API Service for FoodApp
import { API_URL } from '@/config/api';

const API_BASE_URL = `${API_URL}/api`;

export interface AnalyzeFoodResponse {
  success: boolean;
  data: {
    name?: string;
    name_local?: string;
    description?: string;
    cookings_time?: number;
    servings?: number;
    calories?: number;
    difficulty?: string;
    ingredients?: string[];  // Changed to array of strings
    instructions?: string[];  // Changed to array of strings
    error?: string;
    suggestion?: string;
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      
      if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again..');
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw error;
  }
}

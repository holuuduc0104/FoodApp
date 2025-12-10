// API Service for FoodApp
import { API_URL } from '@/config/api';

//const API_BASE_URL = 'http://192.168.1.166:8000/api';
const API_BASE_URL = `${API_URL}/api`;

export interface Article {
  id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  category: string;
  date: string;
  read_time?: string;
  featured: boolean;
  author?: string;
  source?: string;
  url?: string;
}

export interface PaginatedArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
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
 * Upload image to Supabase Storage
 * Returns public URL of uploaded image
 */
export async function uploadImage(imageUri: string): Promise<{ success: boolean; url: string }> {
  try {
    console.log('[uploadImage] Starting upload for URI:', imageUri);
    const formData = new FormData();
    
    // Handle blob URLs (web) vs file URIs (mobile)
    if (imageUri.startsWith('blob:')) {
      console.log('[uploadImage] Detected blob URL, fetching...');
      // Web: fetch blob and convert to File
      const response = await fetch(imageUri);
      console.log('[uploadImage] Blob fetch response:', response.status);
      const blob = await response.blob();
      console.log('[uploadImage] Blob size:', blob.size, 'type:', blob.type);
      const file = new File([blob], 'recipe.jpg', { type: blob.type || 'image/jpeg' });
      formData.append('file', file);
      console.log('[uploadImage] FormData prepared with File');
    } else {
      console.log('[uploadImage] Detected file URI (mobile)');
      // React Native: use file URI
      const filename = imageUri.split('/').pop() || 'recipe.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
      console.log('[uploadImage] FormData prepared with URI');
    }

    const uploadUrl = `${API_BASE_URL}/upload/image`;
    console.log('[uploadImage] Uploading to:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[uploadImage] Upload response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[uploadImage] Upload failed:', errorData);
      throw new Error(errorData.detail || `Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[uploadImage] Upload successful:', result);
    return {
      success: result.success,
      url: result.url,
    };
  } catch (error) {
    console.error('[uploadImage] Error:', error);
    throw error;
  }
}

/**
 * Analyze food image and get dish information with recipe
 */
export async function analyzeFoodImage(imageUri: string): Promise<AnalyzeFoodResponse> {
  try {
    const formData = new FormData();
    
    // Handle blob URLs (web) vs file URIs (mobile)
    if (imageUri.startsWith('blob:')) {
      // Web: fetch blob and convert to File
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
      formData.append('file', file);
    } else {
      // React Native: use file URI
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

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

/**
 * Fetch articles from backend (NewsAPI or Supabase) with pagination
 */
export async function fetchArticles(
  source: 'newsapi' | 'supabase' = 'newsapi',
  category?: string,
  featured?: boolean,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedArticlesResponse> {
  try {
    const params = new URLSearchParams({
      source,
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    if (category) params.append('category', category);
    if (featured !== undefined) params.append('featured', featured.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for pagination

    const response = await fetch(`${API_BASE_URL}/articles?${params.toString()}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaginatedArticlesResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Kiểm tra kết nối mạng');
    }
    throw new Error(error.message || 'Không thể kết nối tới server');
  }
}

/**
 * Fetch featured articles
 */
export async function fetchFeaturedArticles(
  source: 'newsapi' | 'supabase' = 'newsapi',
  limit: number = 5
): Promise<Article[]> {
  try {
    const params = new URLSearchParams({
      source,
      limit: limit.toString(),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${API_BASE_URL}/articles/featured?${params.toString()}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const articles = await response.json();
    return articles;
  } catch (error: any) {
    console.error('Error fetching featured articles:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Kiểm tra kết nối mạng');
    }
    throw new Error(error.message || 'Không thể kết nối tới server');
  }
}

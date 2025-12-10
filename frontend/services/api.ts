// API Service for FoodApp

const API_BASE_URL = 'http://192.168.1.166:8000/api';

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

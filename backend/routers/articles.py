from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_supabase_client
from supabase import Client
from typing import List, Optional
from datetime import datetime
import httpx
from config import get_settings
import time

router = APIRouter()
settings = get_settings()

# Simple cache for NewsAPI results (5 minutes TTL)
_news_cache: dict = {}
CACHE_TTL = 300  # 5 minutes
MAX_PAGE_SIZE = 100  # NewsAPI max per request


class ArticleResponse(BaseModel):
    id: str
    title: str
    description: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    category: str  # 'article', 'event', 'news'
    date: str
    read_time: Optional[str] = None
    featured: bool = False
    author: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None


class ArticleCreate(BaseModel):
    title: str
    description: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    category: str
    read_time: Optional[str] = None
    featured: bool = False


async def fetch_newsapi_articles(query: str = None, page: int = 1, page_size: int = 50):
    """Fetch articles from NewsAPI with caching and pagination
    
    Uses food-focused query to get relevant culinary news only.
    Fetches multiple API pages if needed to fill requested page_size.
    """
    global _news_cache
    
    # Food-focused search query - specific food terms
    food_query = '"recipe" OR "restaurant" OR "cooking" OR "chef" OR "cuisine" OR "food review" OR "dining"'
    
    # Keywords that MUST be present (at least one) - strong food indicators
    FOOD_MUST_KEYWORDS = [
        # Cooking & Recipes
        'recipe', 'recipes', 'cooking', 'cook', 'chef', 'chefs',
        'baking', 'bake', 'baker', 'bakery',
        'grilled', 'roasted', 'fried', 'steamed', 'baked', 'sauteed',
        'homemade', 'home-cooked',
        
        # Restaurant & Dining
        'restaurant', 'restaurants', 'dining', 'dine', 'eatery',
        'michelin', 'bistro', 'cafe', 'cafeteria', 'diner',
        'food truck', 'street food', 'fine dining', 'fast food',
        
        # Food & Dishes
        'cuisine', 'cuisines', 'dish', 'dishes', 'meal', 'meals',
        'food', 'foods', 'menu', 'appetizer', 'entree', 'dessert',
        'breakfast', 'lunch', 'dinner', 'brunch', 'snack',
        'soup', 'salad', 'pasta', 'pizza', 'burger', 'sandwich',
        'sushi', 'noodle', 'steak', 'seafood', 'chicken', 'beef', 'pork',
        'taco', 'burrito', 'curry', 'stir fry', 'bbq', 'barbecue',
        'bread', 'cake', 'pastry', 'cookies', 'ice cream',
        
        # Nutrition & Health
        'nutrition', 'nutritious', 'nutritional', 'nutrient', 'nutrients',
        'diet', 'dietary', 'dieting', 'healthy eating', 'health food',
        'calories', 'calorie', 'protein', 'carbs', 'carbohydrate',
        'vitamin', 'vitamins', 'mineral', 'minerals', 'fiber',
        'organic food', 'superfood', 'whole food', 'plant-based',
        'vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo',
        'weight loss food', 'low-fat', 'low-carb', 'high-protein',
        
        # Ingredients
        'ingredient', 'ingredients', 'spice', 'spices', 'herb', 'herbs',
        'vegetable', 'vegetables', 'fruit', 'fruits', 'meat', 'dairy',
        
        # Food Industry
        'foodie', 'gourmet', 'culinary', 'gastronomy',
        'food safety', 'food recall', 'food price', 'grocery',
        'supermarket', 'food industry', 'food chain',
        'mcdonald', 'burger king', 'kfc', 'wendy', 'chipotle',
        'starbucks', 'dunkin', 'pizza hut', 'domino',
        
        # Taste & Flavor
        'delicious', 'tasty', 'yummy', 'flavor', 'flavour', 'savory'
    ]
    
    # Keywords that indicate NON-food content - comprehensive list
    NON_FOOD_KEYWORDS = [
        # Politics
        'election', 'congress', 'senate', 'democrat', 'republican',
        'parliament', 'legislation', 'ballot', 'trump', 'biden', 'politician',
        
        # War & Military
        'war', 'military', 'weapon', 'missile', 'ukraine', 'russia', 'gaza', 'israel',
        'soldier', 'troops', 'combat', 'invasion', 'army', 'navy',
        
        # Finance & Crypto
        'bitcoin', 'cryptocurrency', 'crypto', 'nasdaq', 'dow jones', 'stock market',
        'hedge fund', 'ipo', 'trading', 'investor',
        
        # Sports (non-food)
        'nfl', 'nba', 'mlb', 'nhl', 'world cup', 'championship', 'playoff',
        'football', 'basketball', 'soccer', 'tennis', 'golf', 'olympics',
        
        # Gaming & Tech
        'video game', 'playstation', 'xbox', 'fortnite', 'esports', 'nintendo',
        'iphone', 'android', 'apple watch', 'samsung',
        
        # Entertainment
        'movie', 'film', 'netflix', 'actor', 'actress', 'hollywood',
        'concert', 'album', 'spotify', 'grammy', 'emmy', 'oscar',
        
        # Crime & Disaster
        'murder', 'shooting', 'terrorism', 'homicide', 'robbery', 'assault',
        'earthquake', 'hurricane', 'wildfire', 'flood',
        
        # Other
        'spacex', 'nasa', 'rocket', 'mars', 'elon musk'
    ]
    
    def is_food_related(title: str, description: str) -> bool:
        """Check if article is STRICTLY food-related"""
        text = f"{title} {description}".lower()
        
        # MUST have at least one food keyword - strict requirement
        has_food = any(keyword in text for keyword in FOOD_MUST_KEYWORDS)
        if not has_food:
            return False
        
        # Reject if has non-food keywords
        has_non_food = any(keyword in text for keyword in NON_FOOD_KEYWORDS)
        return not has_non_food
    
    search_query = query if query else food_query
    cache_key = f"{search_query}_{page}_{page_size}"
    current_time = time.time()
    
    # Check cache first
    if cache_key in _news_cache:
        cached = _news_cache[cache_key]
        if (current_time - cached["timestamp"]) < CACHE_TTL:
            print(f"Returning cached NewsAPI data for page {page}")
            return cached["data"], cached["total"]
    
    try:
        print(f"Fetching fresh data from NewsAPI (page {page}, need {page_size} articles)...")
        all_articles = []
        api_page = page  # Start from requested page
        max_api_pages = 10  # Fetch up to 10 API pages to get enough food articles
        
        async with httpx.AsyncClient() as client:
            for api_attempt in range(max_api_pages):
                url = "https://newsapi.org/v2/everything"
                params = {
                    "q": search_query,
                    "apiKey": settings.newsapi_key,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": MAX_PAGE_SIZE,  # Request max to have more to filter
                    "page": api_page + api_attempt,
                }
                response = await client.get(url, params=params, timeout=30.0)
                
                if response.status_code != 200:
                    error_msg = response.json().get("message", "Unknown error")
                    print(f"NewsAPI error: {response.status_code} - {error_msg}")
                    break
                
                data = response.json()
                total_results = data.get("totalResults", 0)
                
                for idx, article in enumerate(data.get("articles", [])):
                    # Skip articles without required fields or with [Removed] content
                    title = article.get("title")
                    description = article.get("description")
                    image_url = article.get("urlToImage")
                    
                    if not title or not description or not image_url:
                        continue
                        
                    if title == "[Removed]" or description == "[Removed]":
                        continue
                    
                    # Filter: Only include food-related articles
                    if not is_food_related(title, description):
                        continue
                    
                    # Create unique ID based on page and index
                    unique_id = f"news_p{api_page + api_attempt}_{idx}_{article.get('publishedAt', '')}"
                        
                    all_articles.append({
                        "id": unique_id,
                        "title": title,
                        "description": description,
                        "content": article.get("content", ""),
                        "image_url": image_url,
                        "category": "news",
                        "date": article.get("publishedAt", "")[:10] if article.get("publishedAt") else "",
                        "read_time": "5 phút",
                        "featured": page == 1 and len(all_articles) < 3,
                        "author": article.get("author", "NewsAPI"),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "url": article.get("url", "")
                    })
                    
                    # Stop when we have enough valid articles
                    if len(all_articles) >= page_size:
                        break
                
                # If we have enough articles, stop fetching more pages
                if len(all_articles) >= page_size:
                    break
                    
                print(f"Got {len(all_articles)} articles after API page {api_page + api_attempt}, need {page_size}")
            
            # Update cache
            _news_cache[cache_key] = {
                "data": all_articles[:page_size],
                "total": total_results,
                "timestamp": current_time
            }
            print(f"Cached {len(all_articles[:page_size])} articles from NewsAPI (page {page}, total: {total_results})")
            
            return all_articles[:page_size], total_results
    except Exception as e:
        print(f"Error fetching NewsAPI: {e}")
        # Return cached data even if expired, better than nothing
        if cache_key in _news_cache:
            print("Returning stale cached data due to error")
            cached = _news_cache[cache_key]
            return cached["data"], cached["total"]
        return [], 0


class PaginatedArticlesResponse(BaseModel):
    articles: List[ArticleResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


@router.get("/", response_model=PaginatedArticlesResponse)
async def get_articles(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    page: int = 1,
    page_size: int = 30,  # Increased for more content
    source: str = "newsapi",  # "newsapi" or "supabase"
    supabase: Client = Depends(get_supabase_client)
):
    """Get all articles with optional filtering and pagination"""
    try:
        # Validate pagination params
        page = max(1, page)
        page_size = min(max(1, page_size), MAX_PAGE_SIZE)
        
        if source == "newsapi":
            # Fetch from NewsAPI with pagination
            articles, total = await fetch_newsapi_articles(page=page, page_size=page_size)
            
            # Apply filters
            if category and category != "news":
                articles = [a for a in articles if a["category"] == category]
            
            if featured is not None:
                articles = [a for a in articles if a["featured"] == featured]
            
            return {
                "articles": articles,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": page * page_size < total
            }
        else:
            # Fetch from Supabase (original logic) with pagination
            offset = (page - 1) * page_size
            
            # Get total count first
            count_query = supabase.table("articles").select("id", count="exact")
            if category:
                count_query = count_query.eq("category", category)
            if featured is not None:
                count_query = count_query.eq("featured", featured)
            count_response = count_query.execute()
            total = count_response.count or 0
            
            # Get paginated data
            query = supabase.table("articles").select("*")
            
            if category:
                query = query.eq("category", category)
            
            if featured is not None:
                query = query.eq("featured", featured)
            
            response = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
            
            # Format the response
            articles = []
            for article in response.data:
                articles.append({
                    **article,
                    "date": article.get("created_at", "")[:10] if article.get("created_at") else "",
                    "author": None,
                    "source": "FoodApp",
                    "url": None
                })
            
            return {
                "articles": articles,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": page * page_size < total
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/featured", response_model=List[ArticleResponse])
async def get_featured_articles(
    limit: int = 5,
    source: str = "newsapi",
    supabase: Client = Depends(get_supabase_client)
):
    """Get featured articles"""
    try:
        if source == "newsapi":
            articles, _ = await fetch_newsapi_articles(page=1, page_size=10)
            featured = [a for a in articles if a["featured"]]
            return featured[:limit]
        else:
            response = supabase.table("articles").select("*").eq("featured", True).order("created_at", desc=True).limit(limit).execute()
            
            articles = []
            for article in response.data:
                articles.append({
                    **article,
                    "date": article.get("created_at", "")[:10] if article.get("created_at") else "",
                    "author": None,
                    "source": "FoodApp",
                    "url": None
                })
            
            return articles
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Get a specific article by ID"""
    try:
        response = supabase.table("articles").select("*").eq("id", article_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = response.data[0]
        article["date"] = article.get("created_at", "")[:10] if article.get("created_at") else ""
        
        return article
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=ArticleResponse)
async def create_article(
    article: ArticleCreate,
    supabase: Client = Depends(get_supabase_client)
):
    """Create a new article (admin only)"""
    try:
        data = article.dict()
        response = supabase.table("articles").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create article")
        
        created_article = response.data[0]
        created_article["date"] = created_article.get("created_at", "")[:10]
        
        return created_article
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Delete an article (admin only)"""
    try:
        response = supabase.table("articles").delete().eq("id", article_id).execute()
        return {"message": "Article deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

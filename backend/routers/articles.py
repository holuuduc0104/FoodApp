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


async def fetch_newsapi_articles(query: str = None, page: int = 1, page_size: int = 20):
    """Fetch articles from NewsAPI with caching and pagination
    
    Uses food-focused query to get relevant culinary news only.
    """
    global _news_cache
    
    # Food-focused search query - very specific to get only food/cooking related results
    food_query = '"recipe" OR "restaurant" OR "chef" OR "cooking tips" OR "food review"'
    
    # Keywords that MUST be present (at least one) - strong food indicators
    FOOD_MUST_KEYWORDS = [
        'recipe', 'recipes', 'cooking', 'cook', 'chef', 'chefs',
        'restaurant', 'restaurants', 'cuisine', 'cuisines',
        'dish', 'dishes', 'meal', 'meals', 'menu',
        'ingredient', 'ingredients', 'kitchen',
        'baking', 'bake', 'baker', 'bakery',
        'gourmet', 'culinary', 'gastronomy',
        'breakfast', 'lunch', 'dinner', 'brunch',
        'dessert', 'appetizer', 'entree', 'soup', 'salad',
        'pasta', 'pizza', 'burger', 'sandwich', 'sushi', 'noodle',
        'steak', 'seafood', 'vegetarian', 'vegan',
        'michelin', 'foodie', 'bistro', 'cafe', 'diner',
        'delicious', 'tasty', 'yummy', 'flavor', 'flavour',
        'grilled', 'roasted', 'fried', 'steamed', 'baked',
        'homemade', 'food truck', 'street food', 'fine dining',
        'taco', 'burrito', 'curry', 'stir fry', 'bbq', 'barbecue',
        'mcdonald', 'burger king', 'kfc', 'wendy', 'chipotle',
        'starbucks', 'dunkin', 'pizza hut', 'domino',
        'food safety', 'food recall', 'food price', 'grocery',
        'supermarket', 'food industry', 'food chain'
    ]
    
    # Keywords that indicate NON-food content - must NOT be present
    NON_FOOD_KEYWORDS = [
        'disney', 'magic kingdom', 'theme park', 'amusement',
        'movie', 'film', 'actor', 'actress', 'hollywood', 'netflix', 'streaming',
        'politics', 'election', 'president', 'congress', 'senate', 'democrat', 'republican',
        'war', 'military', 'army', 'weapon', 'missile', 'ukraine', 'russia',
        'bitcoin', 'crypto', 'cryptocurrency', 'stock market', 'wall street', 'nasdaq', 'dow jones',
        'football', 'basketball', 'soccer', 'tennis', 'golf', 'nfl', 'nba', 'mlb', 'nhl',
        'celebrity', 'kardashian', 'taylor swift', 'concert', 'album', 'spotify',
        'katy perry', 'justin trudeau', 'justin bieber', 'beyonce', 'drake', 'kanye',
        'piers morgan', 'nick fuentes', 'hili dialogue',
        'video game', 'gaming', 'playstation', 'xbox', 'nintendo', 'esports', 'fortnite',
        'iphone', 'android', 'software', 'app store', 'startup', 'silicon valley',
        'elon musk', 'tesla', 'spacex', 'rocket', 'nasa', 'mars', 'astronaut',
        'climate change', 'earthquake', 'hurricane', 'tornado', 'flood', 'wildfire',
        'murder', 'crime', 'arrest', 'prison', 'court case', 'lawsuit', 'trial', 'verdict',
        'investment', 'investor', 'hedge fund', 'ipo', 'merger', 'acquisition',
        'refrigeration oils', 'market trends', 'industry outlook', 'global summit',
        'liam neeson', 'pamela anderson', 'romance', 'dating', 'instagram official',
        't lounge', 'lounge for december', 'black people', 'racism', 'racist'
    ]
    
    def is_food_related(title: str, description: str) -> bool:
        """Check if article is food-related based on title and description"""
        text = f"{title} {description}".lower()
        
        # First check if any non-food keywords are present - reject immediately
        for keyword in NON_FOOD_KEYWORDS:
            if keyword in text:
                return False
        
        # Then check if at least one food keyword is present - require match
        for keyword in FOOD_MUST_KEYWORDS:
            if keyword in text:
                return True
        
        # No food keywords found - reject
        return False
    
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
        print(f"Fetching fresh data from NewsAPI (page {page})...")
        async with httpx.AsyncClient() as client:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": search_query,
                "apiKey": settings.newsapi_key,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": MAX_PAGE_SIZE,  # Request max to have more to filter
                "page": page,
            }
            response = await client.get(url, params=params, timeout=30.0)
            
            if response.status_code != 200:
                error_msg = response.json().get("message", "Unknown error")
                print(f"NewsAPI error: {response.status_code} - {error_msg}")
                return [], 0
            
            data = response.json()
            total_results = data.get("totalResults", 0)
            articles = []
            
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
                unique_id = f"news_p{page}_{idx}_{article.get('publishedAt', '')}"
                    
                articles.append({
                    "id": unique_id,
                    "title": title,
                    "description": description,
                    "content": article.get("content", ""),
                    "image_url": image_url,
                    "category": "news",
                    "date": article.get("publishedAt", "")[:10] if article.get("publishedAt") else "",
                    "read_time": "5 phút",
                    "featured": page == 1 and len(articles) < 3,  # Only first page has featured
                    "author": article.get("author", "NewsAPI"),
                    "source": article.get("source", {}).get("name", "Unknown"),
                    "url": article.get("url", "")
                })
                
                # Stop when we have enough valid articles
                if len(articles) >= page_size:
                    break
            
            # Update cache
            _news_cache[cache_key] = {
                "data": articles,
                "total": total_results,
                "timestamp": current_time
            }
            print(f"Cached {len(articles)} articles from NewsAPI (page {page}, total: {total_results})")
            
            return articles, total_results
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
    page_size: int = 20,
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

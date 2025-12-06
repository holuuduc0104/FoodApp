from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_supabase_client
from supabase import Client
from typing import List, Optional
from datetime import datetime

router = APIRouter()


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


class ArticleCreate(BaseModel):
    title: str
    description: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    category: str
    read_time: Optional[str] = None
    featured: bool = False


@router.get("/", response_model=List[ArticleResponse])
async def get_articles(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 20,
    supabase: Client = Depends(get_supabase_client)
):
    """Get all articles with optional filtering"""
    try:
        query = supabase.table("articles").select("*")
        
        if category:
            query = query.eq("category", category)
        
        if featured is not None:
            query = query.eq("featured", featured)
        
        response = query.order("created_at", desc=True).limit(limit).execute()
        
        # Format the response
        articles = []
        for article in response.data:
            articles.append({
                **article,
                "date": article.get("created_at", "")[:10] if article.get("created_at") else ""
            })
        
        return articles
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/featured", response_model=List[ArticleResponse])
async def get_featured_articles(
    limit: int = 5,
    supabase: Client = Depends(get_supabase_client)
):
    """Get featured articles"""
    try:
        response = supabase.table("articles").select("*").eq("featured", True).order("created_at", desc=True).limit(limit).execute()
        
        articles = []
        for article in response.data:
            articles.append({
                **article,
                "date": article.get("created_at", "")[:10] if article.get("created_at") else ""
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

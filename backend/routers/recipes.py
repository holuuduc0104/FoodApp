from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_supabase_client
from supabase import Client
from typing import List, Optional

router = APIRouter()


class RecipeResponse(BaseModel):
    id: str
    name: str
    description: str
    ingredients: List[str]
    instructions: str
    cooking_time: int
    difficulty: str
    image_url: Optional[str] = None


@router.get("/recommendations", response_model=List[RecipeResponse])
async def get_recipe_recommendations(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Get recipe recommendations based on user's ingredients"""
    try:
        # Get user's ingredients
        ingredients_response = supabase.table("ingredients").select("name").eq("user_id", user_id).execute()
        
        if not ingredients_response.data:
            return []
        
        user_ingredients = [ing["name"].lower() for ing in ingredients_response.data]
        
        # Get all recipes
        recipes_response = supabase.table("recipes").select("*").execute()
        
        # Filter recipes that match user's ingredients
        matching_recipes = []
        for recipe in recipes_response.data:
            recipe_ingredients = [ing.lower() for ing in recipe.get("ingredients", [])]
            match_count = sum(1 for ing in recipe_ingredients if ing in user_ingredients)
            
            if match_count > 0:
                matching_recipes.append({
                    **recipe,
                    "match_score": match_count
                })
        
        # Sort by match score
        matching_recipes.sort(key=lambda x: x["match_score"], reverse=True)
        
        return matching_recipes[:10]  # Return top 10
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search")
async def search_recipes(
    query: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Search recipes by name"""
    try:
        response = supabase.table("recipes").select("*").ilike("name", f"%{query}%").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Get a specific recipe by ID"""
    try:
        response = supabase.table("recipes").select("*").eq("id", recipe_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

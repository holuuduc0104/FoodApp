from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel
from database import get_supabase_client
from supabase import Client
from typing import List, Optional
from datetime import datetime

router = APIRouter()


# Dependency to get current user from token
async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    supabase: Client = Depends(get_supabase_client)
) -> str:
    """Extract user_id from Authorization header"""
    print(f"Authorization header received: {authorization}")
    
    if not authorization:
        print("No authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        print(f"Invalid format: {authorization[:50]}")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization.replace("Bearer ", "")
    print(f"Received token: {token[:20]}...")
    
    try:
        # Verify token and get user
        user_response = supabase.auth.get_user(token)
        print(f"User response: {user_response}")
        
        # Check if user exists in response
        if hasattr(user_response, 'user') and user_response.user:
            user_id = user_response.user.id
            print(f"Authenticated user_id: {user_id}")
            return user_id
        else:
            print("No user in response")
            raise HTTPException(status_code=401, detail="Invalid token")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


class FavoriteCreate(BaseModel):
    recipe_id: str


class RecipeFromAI(BaseModel):
    """For saving AI-detected recipes to database"""
    user_id: Optional[str] = None  # Optional to see what's in body
    name: str
    description: Optional[str] = None
    ingredients: List[str]  # Array of ingredient strings
    instructions: Optional[List[str]] = None  # Array of instruction strings
    cookings_time: Optional[int] = None  # Changed from cooking_time to cookings_time
    servings: Optional[int] = 1
    difficulty: Optional[str] = "medium"
    calories: Optional[int] = None  # Added calories field
    image_url: Optional[str] = None


class FavoriteResponse(BaseModel):
    id: str
    user_id: str
    recipe_id: str
    created_at: str
    recipe: dict


@router.post("/", response_model=dict)
async def add_favorite(
    favorite: FavoriteCreate,
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Add a recipe to user's favorites"""
    try:
        # Check if recipe exists
        recipe_check = supabase.table("recipes").select("id").eq("id", favorite.recipe_id).execute()
        if not recipe_check.data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Add to favorites
        response = supabase.table("favorites").insert({
            "user_id": user_id,
            "recipe_id": favorite.recipe_id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to add favorite")
        
        return {"message": "Recipe added to favorites", "data": response.data[0]}
    except Exception as e:
        if "unique_user_recipe" in str(e):
            raise HTTPException(status_code=409, detail="Recipe already in favorites")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/save-ai-recipe", response_model=dict)
async def save_ai_recipe_to_favorites(
    request: Request,
    recipe_data: RecipeFromAI,
    supabase: Client = Depends(get_supabase_client),
):
    """
    Save AI-detected recipe to database and add to favorites
    Used when user wants to save a recipe detected by camera AI
    """
    # Debug: log raw body
    body = await request.body()
    print(f"Raw request body: {body.decode()[:500]}...")
    
    # Get user_id from request body (sent from frontend session)
    user_id = recipe_data.user_id
    print(f"Extracted user_id: {user_id}")
    
    try:
        print(f"Using user_id from request: {user_id}")
        print(f"Received recipe data: {recipe_data.model_dump()}")
        
        # First, save the recipe to database
        # Map fields to match database schema (based on Supabase recipes table)
        recipe_insert_data = {
            "name": recipe_data.name,
            "description": recipe_data.description,
            "ingredients": recipe_data.ingredients,
        }
        
        # Add optional fields only if they have values and exist in DB
        if recipe_data.instructions:
            recipe_insert_data["instructions"] = recipe_data.instructions
        if recipe_data.cookings_time:
            recipe_insert_data["cookings_time"] = recipe_data.cookings_time
        if recipe_data.servings:
            recipe_insert_data["servings"] = recipe_data.servings
        if recipe_data.difficulty:
            recipe_insert_data["difficulty"] = recipe_data.difficulty
        if recipe_data.calories:
            recipe_insert_data["calories"] = recipe_data.calories
        if recipe_data.image_url:
            recipe_insert_data["image_url"] = recipe_data.image_url
        
        print(f"Inserting recipe: {recipe_insert_data}")
        recipe_response = supabase.table("recipes").insert(recipe_insert_data).execute()
        
        if not recipe_response.data:
            print(f"Failed to insert recipe. Response: {recipe_response}")
            raise HTTPException(status_code=400, detail="Failed to save recipe")
        
        recipe_id = recipe_response.data[0]["id"]
        print(f"Recipe saved with ID: {recipe_id}")
        
        # Then add to favorites
        favorite_response = supabase.table("favorites").insert({
            "user_id": user_id,
            "recipe_id": recipe_id
        }).execute()
        
        print(f"Favorite added: {favorite_response.data}")
        
        return {
            "message": "Recipe saved and added to favorites",
            "recipe": recipe_response.data[0],
            "favorite": favorite_response.data[0] if favorite_response.data else None
        }
    except Exception as e:
        print(f"Error in save_ai_recipe_to_favorites: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[dict])
async def get_user_favorites(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Get all favorite recipes for a user"""
    try:
        # Get favorites with recipe details
        response = supabase.table("favorites")\
            .select("*, recipes(*)")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{recipe_id}")
async def remove_favorite(
    recipe_id: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Remove a recipe from user's favorites"""
    try:
        response = supabase.table("favorites")\
            .delete()\
            .eq("user_id", user_id)\
            .eq("recipe_id", recipe_id)\
            .execute()
        
        return {"message": "Recipe removed from favorites"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/check/{recipe_id}")
async def check_is_favorite(
    recipe_id: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Check if a recipe is in user's favorites"""
    try:
        response = supabase.table("favorites")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("recipe_id", recipe_id)\
            .execute()
        
        return {"is_favorite": len(response.data) > 0}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

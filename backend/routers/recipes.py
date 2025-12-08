from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_supabase_client
from supabase import Client
from typing import List, Optional
import json

router = APIRouter()


def parse_list_field(field_value):
    """Parse a field that might be a string or a list into a proper list"""
    if isinstance(field_value, list):
        # If already a list, filter out bracket characters and clean strings
        cleaned = []
        for item in field_value:
            if isinstance(item, str):
                # Remove quotes and whitespace
                clean_item = item.strip().strip("'").strip('"').strip(',').strip()
                # Skip bracket characters
                if clean_item and clean_item not in ['[', ']', '{', '}']:
                    cleaned.append(clean_item)
            else:
                cleaned.append(str(item))
        return cleaned
    
    if isinstance(field_value, str):
        # Try to parse as JSON if it looks like a JSON array
        if field_value.strip().startswith('['):
            try:
                # Remove extra whitespace and newlines
                cleaned = field_value.strip()
                parsed = json.loads(cleaned)
                return parsed if isinstance(parsed, list) else [str(parsed)]
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract items manually
                # Remove outer brackets and split by comma
                cleaned = field_value.strip().strip('[').strip(']')
                items = []
                for item in cleaned.split(','):
                    clean_item = item.strip().strip("'").strip('"').strip()
                    if clean_item:
                        items.append(clean_item)
                return items
        else:
            # Split by newlines for regular text
            return [line.strip() for line in field_value.split('\n') if line.strip()]
    return []


class RecipeResponse(BaseModel):
    id: str
    name: str
    image_url: Optional[str] = None
    description: str
    cookings_time: int
    servings: int
    calories: int
    difficulty: str
    ingredients: List[str]
    instructions: List[str]


@router.get("/", response_model=List[RecipeResponse])
async def get_all_recipes(
    supabase: Client = Depends(get_supabase_client)
):
    """Get all recipes from database"""
    try:
        response = supabase.table("recipes").select("*").execute()
        
        # Parse and clean the data
        recipes = []
        for recipe in response.data if response.data else []:
            recipes.append({
                "id": recipe.get("id"),
                "name": recipe.get("name"),
                "image_url": recipe.get("image_url"),
                "description": recipe.get("description", ""),
                "cookings_time": recipe.get("cookings_time", 30),
                "servings": recipe.get("servings", 2),
                "calories": recipe.get("calories", 0),
                "difficulty": recipe.get("difficulty", "Medium"),
                "ingredients": parse_list_field(recipe.get("ingredients", [])),
                "instructions": parse_list_field(recipe.get("instructions", ""))
            })
        
        return recipes
    except Exception as e:
        print(f"Error getting all recipes: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# @router.get("/recommendations", response_model=List[RecipeResponse])
# async def get_recipe_recommendations(
#     user_id: str,
#     supabase: Client = Depends(get_supabase_client)
# ):
#     """Get recipe recommendations based on user's ingredients"""
#     try:
#         # Get user's ingredients
#         ingredients_response = supabase.table("ingredients").select("name").eq("user_id", user_id).execute()
#         
#         if not ingredients_response.data:
#             return []
#         
#         user_ingredients = [ing["name"].lower() for ing in ingredients_response.data]
#         
#         # Get all recipes
#         recipes_response = supabase.table("recipes").select("*").execute()
#         
#         # Filter recipes that match user's ingredients
#         matching_recipes = []
#         for recipe in recipes_response.data:
#             recipe_ingredients = [ing.lower() for ing in recipe.get("ingredients", [])]
#             match_count = sum(1 for ing in recipe_ingredients if ing in user_ingredients)
#             
#             if match_count > 0:
#                 matching_recipes.append({
#                     **recipe,
#                     "match_score": match_count
#                 })
#         
#         # Sort by match score
#         matching_recipes.sort(key=lambda x: x["match_score"], reverse=True)
#         
#         return matching_recipes[:10]  # Return top 10
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))


@router.get("/search")
async def search_recipes(
    query: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Search recipes by name"""
    try:
        response = supabase.table("recipes").select("*").ilike("name", f"%{query}%").execute()
        
        # Parse and clean the data
        recipes = []
        for recipe in response.data if response.data else []:
            recipes.append({
                "id": recipe.get("id"),
                "name": recipe.get("name"),
                "image_url": recipe.get("image_url"),
                "description": recipe.get("description", ""),
                "cookings_time": recipe.get("cookings_time", 30),
                "servings": recipe.get("servings", 2),
                "calories": recipe.get("calories", 0),
                "difficulty": recipe.get("difficulty", "Medium"),
                "ingredients": parse_list_field(recipe.get("ingredients", [])),
                "instructions": parse_list_field(recipe.get("instructions", ""))
            })
        
        return recipes
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
        
        recipe = response.data[0]
        
        # Parse and clean the data
        return {
            "id": recipe.get("id"),
            "name": recipe.get("name"),
            "image_url": recipe.get("image_url"),
            "description": recipe.get("description", ""),
            "cookings_time": recipe.get("cookings_time", 30),
            "servings": recipe.get("servings", 2),
            "calories": recipe.get("calories", 0),
            "difficulty": recipe.get("difficulty", "Medium"),
            "ingredients": parse_list_field(recipe.get("ingredients", [])),
            "instructions": parse_list_field(recipe.get("instructions", ""))
        }
    except Exception as e:
        print(f"Error getting recipe: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from database import get_supabase_client
from supabase import Client
from typing import List

router = APIRouter()


class IngredientCreate(BaseModel):
    name: str


class IngredientResponse(BaseModel):
    id: str
    name: str
    user_id: str
    created_at: str


@router.get("/", response_model=List[IngredientResponse])
async def get_ingredients(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Get all ingredients for a user"""
    try:
        response = supabase.table("ingredients").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search")
async def search_ingredients(
    query: str = Query(default="", min_length=0),
    limit: int = Query(default=50, le=100),
    supabase: Client = Depends(get_supabase_client)
):
    """Search ingredients by name in database"""
    try:
        if not query or query.strip() == "":
            # Return empty list if no query
            return []
        
        # Search using ilike for case-insensitive search
        search_pattern = f"%{query}%"
        response = supabase.table("ingredients").select("id, name").ilike("name", search_pattern).limit(limit).execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"Error searching ingredients: {e}")
        return []


@router.get("/popular")
async def get_popular_ingredients(
    ids: str = Query(default="1,2,3,4,5,6"),
    supabase: Client = Depends(get_supabase_client)
):
    """Get popular ingredients by IDs"""
    try:
        # Parse comma-separated string to list of integers
        id_list = [int(id.strip()) for id in ids.split(',') if id.strip()]
        
        # Convert list of IDs to filter
        response = supabase.table("ingredients").select("id, name").in_("id", id_list).execute()
        
        if not response.data:
            # Return default popular ingredients if none found
            return [
                {"id": 1, "name": "Tomato"},
                {"id": 2, "name": "Onion"},
                {"id": 3, "name": "Garlic"},
                {"id": 4, "name": "Carrot"},
                {"id": 5, "name": "Potato"},
                {"id": 6, "name": "Chicken"},
            ]
        
        return response.data
    except Exception as e:
        print(f"Error fetching popular ingredients: {e}")
        # Return default list on error
        return [
            {"id": 1, "name": "Tomato"},
            {"id": 2, "name": "Onion"},
            {"id": 3, "name": "Garlic"},
            {"id": 4, "name": "Carrot"},
            {"id": 5, "name": "Potato"},
            {"id": 6, "name": "Chicken"},
        ]


@router.post("/", response_model=IngredientResponse)
async def add_ingredient(
    ingredient: IngredientCreate,
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Add a new ingredient"""
    try:
        response = supabase.table("ingredients").insert({
            "name": ingredient.name,
            "user_id": user_id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to add ingredient")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{ingredient_id}")
async def delete_ingredient(
    ingredient_id: str,
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Delete an ingredient"""
    try:
        response = supabase.table("ingredients").delete().eq("id", ingredient_id).eq("user_id", user_id).execute()
        return {"message": "Ingredient deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/")
async def clear_ingredients(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Clear all ingredients for a user"""
    try:
        response = supabase.table("ingredients").delete().eq("user_id", user_id).execute()
        return {"message": "All ingredients cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends
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

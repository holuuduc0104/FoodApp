# routers/spoonacular_api.py

import requests
from fastapi import APIRouter, Query
from config import get_settings

router = APIRouter()
settings = get_settings()

SPOONACULAR_API_KEY = settings.spoonacular_api_key
BASE_URL = "https://api.spoonacular.com"

# 1️⃣ Lấy danh sách món ăn theo nguyên liệu
@router.get("/recipes/by-ingredients")
def get_recipes_by_ingredients(ingredients: str = Query(...)):
    url = f"{BASE_URL}/recipes/findByIngredients"
    params = {
        "ingredients": ingredients,
        "number": 10,
        "apiKey": SPOONACULAR_API_KEY
    }

    response = requests.get(url, params=params)
    return response.json()


# 2️⃣ Lấy các bước làm món ăn (instructions)
@router.get("/recipes/{recipe_id}/instructions")
def get_recipe_instructions(recipe_id: int):
    url = f"{BASE_URL}/recipes/{recipe_id}/analyzedInstructions"
    params = {"apiKey": SPOONACULAR_API_KEY}

    response = requests.get(url, params=params)
    return response.json()

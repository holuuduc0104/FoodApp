from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from config import get_settings
from PIL import Image
import io
import base64
import requests
from typing import Dict

router = APIRouter()
settings = get_settings()


def analyze_with_gemini(image_bytes: bytes, prompt: str) -> str:
    """
    Call Gemini API directly using REST API
    """
    # Convert image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": base64_image
                    }
                }
            ]
        }]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    # Debug: print response details
    print(f"Status Code: {response.status_code}")
    
    # Check for rate limit error
    if response.status_code == 429:
        error_data = response.json()
        error_msg = error_data.get('error', {}).get('message', 'Rate limit exceeded')
        print(f"Gemini API Rate Limit: {error_msg}")
        raise HTTPException(
            status_code=429,
            detail="Gemini API rate limit exceeded. Please wait a moment and try again."
        )
    
    response.raise_for_status()
    
    result = response.json()
    
    if 'candidates' in result and len(result['candidates']) > 0:
        return result['candidates'][0]['content']['parts'][0]['text']
    else:
        raise Exception("No response from Gemini API")


@router.post("/analyze-food")
async def analyze_food_image(file: UploadFile = File(...)) -> Dict:
    """
    Analyze food image using Gemini AI to detect dish and provide recipe
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Prepare prompt for Gemini
        prompt = """
        Analyze this food image and provide detailed information in the following JSON format:
        
        {
            "name": "Dish name in English",
            "name_local": "Dish name in local language (Vietnamese if applicable)",
            "description": "Detailed description of the dish (2-3 sentences about what it is, main ingredients, and flavors)",
            "cookings_time": "Total cooking time in minutes (as integer, e.g., 30)",
            "servings": "Number of servings (as integer, e.g., 1, 2, 4)",
            "calories": "Total calories in kcal (as integer, e.g., 450)",
            "difficulty": "Difficulty level: easy, medium, or hard",
            "ingredients": [
                "400g spaghetti",
                "200g pancetta or guanciale",
                "4 large egg yolks",
                "100g Pecorino Romano cheese"
            ],
            "instructions": [
                "Bring a large pot of salted water to boil and cook spaghetti according to package directions.",
                "While pasta cooks, cut pancetta into small cubes and fry in a large pan until crispy.",
                "In a bowl, whisk together egg yolks, grated Pecorino, and Parmesan cheese.",
                "When pasta is al dente, reserve 1 cup of pasta water, then drain."
            ]
        }
        
        Important guidelines:
        - For "cookings_time": provide total time (prep + cook) as a single integer number in minutes
        - For "servings": provide as integer (typically 1-4)
        - For "calories": estimate total calories as integer
        - For "ingredients": return as array of strings, each string should include quantity and ingredient name (e.g., "400g spaghetti", "2 eggs", "Salt to taste")
        - For "instructions": return as array of strings, each string is one step in the cooking process
        - For "description": describe what makes this dish special and tasty
        - Be specific with quantities and use standard units (grams, ml, tablespoon, teaspoon, cup, pieces, etc.)
        
        If this is not a food image, return:
        {
            "error": "No food detected in the image",
            "suggestion": "Please take a clearer picture of a food dish"
        }
        
        Return ONLY the JSON response, no additional text.
        """
        
        # Generate content with Gemini
        response_text = analyze_with_gemini(image_data, prompt).strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        # Parse JSON response
        import json
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, return raw response
            result = {
                "error": "Failed to parse AI response",
                "raw_response": response_text
            }
        
        return JSONResponse(content={
            "success": True,
            "data": result
        })
        
    except HTTPException:
        # Re-raise HTTPException (including rate limit errors)
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error analyzing image: {str(e)}"
        print(f"{error_detail}\n{traceback.format_exc()}")  # Print to console for debugging
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )

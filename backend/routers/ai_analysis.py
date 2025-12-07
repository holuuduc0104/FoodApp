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
    print(f"Response: {response.text[:500]}")  # Print first 500 chars
    
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
        Hãy phân tích hình ảnh này và cung cấp thông tin chi tiết theo định dạng JSON sau:
        
        {
            "dish_name": "Tên món ăn (tiếng Việt)",
            "dish_name_en": "Dish name (English)",
            "confidence": "Mức độ tự tin (high/medium/low)",
            "ingredients": [
                {
                    "name": "Tên nguyên liệu",
                    "quantity": "Số lượng ước tính",
                    "unit": "Đơn vị (gram, ml, củ, quả, v.v.)"
                }
            ],
            "recipe": {
                "prep_time": "Thời gian chuẩn bị (phút)",
                "cook_time": "Thời gian nấu (phút)",
                "servings": "Số người ăn",
                "difficulty": "Độ khó (dễ/trung bình/khó)",
                "steps": [
                    "Bước 1: Mô tả chi tiết",
                    "Bước 2: Mô tả chi tiết",
                    "..."
                ]
            },
            "nutrition": {
                "calories": "Calories (kcal)",
                "protein": "Protein (g)",
                "carbs": "Carbs (g)",
                "fat": "Fat (g)"
            },
            "tips": [
                "Mẹo 1",
                "Mẹo 2"
            ],
            "description": "Mô tả ngắn gọn về món ăn"
        }
        
        Nếu không phải là hình ảnh món ăn, hãy trả về:
        {
            "error": "Không phát hiện món ăn trong hình ảnh",
            "suggestion": "Vui lòng chụp ảnh món ăn rõ ràng hơn"
        }
        
        Chỉ trả về JSON, không thêm text khác.
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
        
    except Exception as e:
        import traceback
        error_detail = f"Error analyzing image: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Print to console for debugging
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )


@router.post("/detect-ingredients")
async def detect_ingredients(file: UploadFile = File(...)) -> Dict:
    """
    Detect ingredients from image using Gemini AI
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
        Hãy phân tích hình ảnh này và liệt kê tất cả các nguyên liệu thực phẩm có thể nhìn thấy.
        Trả về kết quả theo định dạng JSON:
        
        {
            "ingredients": [
                {
                    "name": "Tên nguyên liệu (tiếng Việt)",
                    "name_en": "Ingredient name (English)",
                    "category": "Loại (rau củ/thịt/hải sản/gia vị/v.v.)",
                    "confidence": "Mức độ tự tin (high/medium/low)"
                }
            ],
            "total_count": số_lượng_nguyên_liệu
        }
        
        Chỉ trả về JSON, không thêm text khác.
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
            result = {
                "error": "Failed to parse AI response",
                "raw_response": response_text
            }
        
        return JSONResponse(content={
            "success": True,
            "data": result
        })
        
    except Exception as e:
        import traceback
        error_detail = f"Error detecting ingredients: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Print to console for debugging
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )

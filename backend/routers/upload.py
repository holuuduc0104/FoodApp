from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from database import get_supabase_client
from supabase import Client
import uuid
from datetime import datetime

router = APIRouter()

BUCKET_NAME = "recipe-images"  # Đổi tên bucket nếu bạn đặt tên khác

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Upload image to Supabase Storage and return public URL
    Accepts: JPEG, PNG, WebP
    Max size: 5MB
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Read file content
        contents = await file.read()
        
        # Check file size (5MB limit)
        max_size = 5 * 1024 * 1024  # 5MB
        if len(contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 5MB"
            )
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{timestamp}_{unique_id}.{file_ext}"
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=contents,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        
        return {
            "success": True,
            "filename": filename,
            "url": public_url,
            "message": "Image uploaded successfully"
        }
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.delete("/image/{filename}")
async def delete_image(
    filename: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Delete image from Supabase Storage"""
    try:
        supabase.storage.from_(BUCKET_NAME).remove([filename])
        return {
            "success": True,
            "message": "Image deleted successfully"
        }
    except Exception as e:
        print(f"Delete error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete image: {str(e)}"
        )

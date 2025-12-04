from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_supabase_client
from supabase import Client

router = APIRouter()


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


@router.post("/signup", response_model=AuthResponse)
async def sign_up(
    request: SignUpRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """Register a new user"""
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })
        
        if response.user is None:
            raise HTTPException(status_code=400, detail="Sign up failed")
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": request.full_name
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signin", response_model=AuthResponse)
async def sign_in(
    request: SignInRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """Login user"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/signout")
async def sign_out(supabase: Client = Depends(get_supabase_client)):
    """Logout user"""
    try:
        supabase.auth.sign_out()
        return {"message": "Signed out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
async def get_current_user(supabase: Client = Depends(get_supabase_client)):
    """Get current user info"""
    try:
        user = supabase.auth.get_user()
        if user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Not authenticated")

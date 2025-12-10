from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Get the directory where config.py is located
BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # Gemini AI
    gemini_api_key: str
    
    # NewsAPI
    newsapi_key: str
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # CORS
    allowed_origins: str = "http://localhost:8081"
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()

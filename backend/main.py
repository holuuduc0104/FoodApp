from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings

settings = get_settings()

app = FastAPI(
    title="FoodApp API",
    description="Smart Meal Recommendation API with AI Camera Detection",
    version="1.0.0",
    debug=settings.debug
)

# CORS Configuration
origins = settings.allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n=== Request: {request.method} {request.url.path} ===")
    print(f"Headers: {dict(request.headers)}")
    response = await call_next(request)
    return response


@app.get("/")
async def root():
    return {
        "message": "Welcome to FoodApp API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Import routers
from routers import auth, ingredients, recipes, articles, ai_analysis, favorites, spoonacular_api, upload

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Ingredients"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(ai_analysis.router, prefix="/api/ai", tags=["AI Analysis"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["Favorites"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])

# Router mới để gọi Spoonacular API
app.include_router(spoonacular_api.router, prefix="/api/external", tags=["External Recipes"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )

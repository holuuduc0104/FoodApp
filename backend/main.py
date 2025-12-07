from fastapi import FastAPI
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
from routers import auth, ingredients, recipes, articles, ai_analysis

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Ingredients"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(ai_analysis.router, prefix="/api/ai", tags=["AI Analysis"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )

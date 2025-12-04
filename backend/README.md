# Python Backend

## Setup

### 1. Create virtual environment
```bash
cd backend
python -m venv venv
```

### 2. Activate virtual environment
**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase URL and keys from [Supabase Dashboard](https://supabase.com/dashboard)

### 5. Run the server
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user
- `GET /api/auth/me` - Get current user

### Ingredients
- `GET /api/ingredients/?user_id=xxx` - Get all ingredients
- `POST /api/ingredients/?user_id=xxx` - Add ingredient
- `DELETE /api/ingredients/{id}?user_id=xxx` - Delete ingredient
- `DELETE /api/ingredients/?user_id=xxx` - Clear all ingredients

### Recipes
- `GET /api/recipes/recommendations?user_id=xxx` - Get recommended recipes
- `GET /api/recipes/search?query=xxx` - Search recipes
- `GET /api/recipes/{id}` - Get recipe by ID

## API Documentation
Once server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

My Smart Meal App Project
# FoodApp - Smart Meal Recommendation

## 📁 Project Structure

```
FoodApp/
├── frontend/          # React Native (Expo) Mobile App
│   ├── app/          # Expo Router screens
│   ├── assets/       # Images, fonts
│   ├── components/   # Reusable components
│   ├── context/      # React Context
│   ├── hooks/        # Custom hooks
│   ├── app.json      # Expo config
│   ├── package.json  # Frontend dependencies
│   └── tsconfig.json # TypeScript config
│
├── backend/          # Python (FastAPI) API Server
│   ├── routers/      # API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── ingredients.py   # Ingredients management
│   │   └── recipes.py       # Recipe recommendations
│   ├── main.py       # FastAPI app
│   ├── config.py     # Settings
│   ├── database.py   # Supabase connection
│   ├── requirements.txt
│   └── .env          # Environment variables
│
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator / Android Emulator / Physical device with Expo Go

### Installation

#### 1. **Clone the repository**
```bash
git clone https://github.com/holuuduc0104/FoodApp.git
cd FoodApp
```

#### 2. **Install Frontend dependencies**
```bash
cd frontend
npm install
```

#### 3. **Install Backend dependencies**
```bash
cd ../backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### 4. **Configure Backend**
Create `.env` file in `backend/` directory:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## 🏃 Running the Application

### Start Backend Server
```bash
cd backend
python main.py
```
Backend will run on: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Start Frontend App
```bash
cd frontend
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

## 📱 Features

- ✅ **AI Camera Detection** - Scan ingredients with camera
- ✅ **Manual Input** - Type ingredients manually
- ✅ **Smart Recommendations** - Get meal suggestions based on available ingredients
- ✅ **Recipe Search** - Find recipes by name
- ✅ **User Authentication** - Sign up / Sign in
- ⏳ **Favorites** - Save favorite recipes (Coming soon)

## 🛠 Tech Stack

### Frontend
- **React Native** with **Expo**
- **TypeScript**
- **Expo Router** - File-based routing
- **Lucide React Native** - Icons
- **React Context** - State management

### Backend
- **Python** with **FastAPI**
- **Supabase** - Database & Authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user

### Ingredients
- `GET /api/ingredients/` - Get all ingredients
- `POST /api/ingredients/` - Add ingredient
- `DELETE /api/ingredients/{id}` - Delete ingredient

### Recipes
- `GET /api/recipes/recommendations` - Get recommended recipes
- `GET /api/recipes/search` - Search recipes
- `GET /api/recipes/{id}` - Get recipe details

## 🗄 Database Schema (Supabase)

### Users Table (built-in auth.users)
- id (uuid, primary key)
- email (text)
- created_at (timestamp)

### Ingredients Table
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Recipes Table
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[],
  instructions TEXT,
  cooking_time INTEGER,
  difficulty TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Hồ Lưu Đức**
- GitHub: [@holuuduc0104](https://github.com/holuuduc0104)

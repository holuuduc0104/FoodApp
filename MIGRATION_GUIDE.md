# Migration Guide - Restructure to Monorepo

## Cấu trúc mới:
```
FoodApp/
├── frontend/     # Mobile App (React Native)
└── backend/      # API Server (Python FastAPI)
```

## Các bước di chuyển:

### 1. Tạo thư mục frontend (đã có)
```bash
mkdir frontend
```

### 2. Di chuyển files frontend
**Cách 1: Dùng File Explorer (Windows)**
- Mở File Explorer
- Vào thư mục `FoodApp`
- Di chuyển các folder/file sau vào `frontend/`:
  - `app/`
  - `assets/`
  - `context/`
  - `hooks/`
  - `app.json`
  - `package.json`
  - `package-lock.json`
  - `tsconfig.json`
  - `expo-env.d.ts`
  - `.prettierrc`

**Cách 2: Dùng lệnh (Git Bash)**
```bash
# Từ thư mục FoodApp
git mv app frontend/
git mv assets frontend/
git mv context frontend/
git mv hooks frontend/
git mv app.json frontend/
git mv package.json frontend/
git mv package-lock.json frontend/
git mv tsconfig.json frontend/
git mv expo-env.d.ts frontend/
git mv .prettierrc frontend/
```

### 3. Thư mục backend đã được tạo sẵn
Backend đã có sẵn trong `backend/`

### 4. Cập nhật file .gitignore (root)
File `.gitignore` ở root giữ nguyên

### 5. Tạo package.json mới cho root (optional - nếu muốn dùng npm workspaces)
```json
{
  "name": "foodapp-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend"
  ],
  "scripts": {
    "frontend": "cd frontend && npm start",
    "backend": "cd backend && python main.py"
  }
}
```

### 6. Cài lại dependencies
```bash
# Frontend
cd frontend
npm install

# Backend (nếu chưa cài)
cd ../backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 7. Cập nhật README.md
```bash
# Thay thế README.md cũ bằng README_NEW.md
mv README_NEW.md README.md
```

### 8. Test
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm start
```

## Sau khi di chuyển xong:

Cấu trúc cuối cùng:
```
FoodApp/
├── frontend/
│   ├── app/
│   ├── assets/
│   ├── context/
│   ├── hooks/
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── routers/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── .gitignore
└── README.md
```

# Cài đặt và Sử dụng Tính năng Phân tích Món ăn với Gemini AI

## Hướng dẫn cài đặt Backend

### 1. Cài đặt dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Cấu hình API Key Gemini

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey) để tạo API key
2. Copy file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
3. Thêm Gemini API key vào file `.env`:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

### 3. Chạy Backend Server
```bash
cd backend
python main.py
```

Server sẽ chạy tại `http://localhost:8000`

## Hướng dẫn cài đặt Frontend

### 1. Cài đặt dependencies
```bash
cd frontend
npm install
```

### 2. Cài đặt expo-image-picker
```bash
npx expo install expo-image-picker
```

### 3. Chạy Frontend
```bash
npm run dev
```

hoặc

```bash
npx expo start
```

## Sử dụng

### 1. Chụp ảnh món ăn
- Mở tab Camera trong ứng dụng
- Cấp quyền camera nếu được yêu cầu
- Hướng camera vào món ăn
- Nhấn nút "Chụp" để chụp ảnh

### 2. Chọn ảnh từ thư viện
- Nhấn nút "Chọn ảnh"
- Chọn ảnh món ăn từ thư viện
- Ảnh sẽ được gửi đến AI để phân tích

### 3. Xem kết quả
Sau khi phân tích, bạn sẽ nhận được:
- **Tên món ăn** (tiếng Việt và tiếng Anh)
- **Danh sách nguyên liệu** với số lượng và đơn vị
- **Công thức nấu ăn** chi tiết theo từng bước
- **Thông tin dinh dưỡng** (calories, protein, carbs, fat)
- **Mẹo nấu ăn** hữu ích
- **Mô tả món ăn**

## API Endpoints

### 1. Phân tích món ăn
```
POST /api/ai/analyze-food
Content-Type: multipart/form-data

Body:
- file: Image file (jpg, png, etc.)

Response:
{
  "success": true,
  "data": {
    "dish_name": "Tên món ăn",
    "dish_name_en": "Dish name",
    "confidence": "high/medium/low",
    "ingredients": [...],
    "recipe": {...},
    "nutrition": {...},
    "tips": [...],
    "description": "Mô tả"
  }
}
```

### 2. Phát hiện nguyên liệu
```
POST /api/ai/detect-ingredients
Content-Type: multipart/form-data

Body:
- file: Image file (jpg, png, etc.)

Response:
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "name": "Tên nguyên liệu",
        "name_en": "Ingredient name",
        "category": "Loại",
        "confidence": "high/medium/low"
      }
    ],
    "total_count": 5
  }
}
```

## Lưu ý

1. **Gemini API Key**: Đảm bảo bạn đã thêm API key hợp lệ vào file `.env`
2. **Kết nối mạng**: Backend và frontend cần kết nối internet để gọi Gemini API
3. **Chất lượng ảnh**: Ảnh càng rõ nét, kết quả phân tích càng chính xác
4. **Giới hạn API**: Google Gemini có giới hạn số lượng request miễn phí, kiểm tra quota tại Google AI Studio

## Troubleshooting

### Backend không khởi động được
- Kiểm tra Python version (yêu cầu Python 3.8+)
- Kiểm tra tất cả dependencies đã được cài đặt: `pip list`
- Kiểm tra file `.env` đã được tạo và có đầy đủ thông tin

### Frontend không kết nối được với backend
- Đảm bảo backend đang chạy tại `http://localhost:8000`
- Kiểm tra file `frontend/services/api.ts`, đảm bảo `API_BASE_URL` đúng
- Nếu chạy trên thiết bị thật, thay `localhost` bằng IP máy tính (VD: `http://192.168.1.100:8000`)

### Lỗi phân tích ảnh
- Kiểm tra Gemini API key còn hiệu lực
- Kiểm tra kết nối internet
- Kiểm tra logs backend để xem chi tiết lỗi
- Đảm bảo ảnh có định dạng hợp lệ (jpg, png, etc.)

## Tính năng trong tương lai

- [ ] Lưu lịch sử phân tích món ăn
- [ ] Chia sẻ công thức nấu ăn
- [ ] Đánh giá và review món ăn
- [ ] Gợi ý món ăn dựa trên nguyên liệu có sẵn
- [ ] Hỗ trợ nhiều ngôn ngữ

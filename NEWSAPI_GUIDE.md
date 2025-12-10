# Hướng Dẫn Tích Hợp NewsAPI

## Tổng Quan

FoodApp sử dụng NewsAPI để lấy tin tức về ẩm thực, nấu ăn, và dinh dưỡng. Tính năng này cho phép người dùng đọc các bài viết mới nhất ngay trong ứng dụng.

## Cấu Hình

### 1. Lấy API Key từ NewsAPI

1. Truy cập [https://newsapi.org/](https://newsapi.org/)
2. Đăng ký tài khoản miễn phí
3. Lấy API key từ dashboard

### 2. Cấu Hình Backend

#### Thêm API Key vào file `.env`

```bash
# backend/.env
NEWSAPI_KEY=your_newsapi_key_here
```

⚠️ **Lưu ý**: File `.env` đã được thêm vào `.gitignore` để bảo vệ API key. **KHÔNG** commit file này lên git.

#### Cấu Trúc Config

File `backend/config.py` sử dụng Pydantic Settings để tự động load biến môi trường:

```python
class Settings(BaseSettings):
    newsapi_key: str  # Tự động load từ NEWSAPI_KEY trong .env
    
    class Config:
        env_file = ".env"
```

### 3. API Endpoint

#### GET `/api/articles`

Lấy danh sách bài viết tin tức về ẩm thực.

**Query Parameters:**
- `source` (string): Nguồn tin tức (`newsapi` hoặc `supabase`). Mặc định: `newsapi`
- `category` (string, optional): Danh mục tin tức. Mặc định: `food OR cooking OR recipe OR nutrition`
- `limit` (integer): Số lượng bài viết. Mặc định: `10`, tối đa: `100`

**Ví dụ Request:**

```bash
# Lấy 15 bài viết về ẩm thực
curl "http://localhost:8000/api/articles?source=newsapi&limit=15"

# Lấy bài viết với danh mục cụ thể
curl "http://localhost:8000/api/articles?source=newsapi&category=vegan&limit=10"
```

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "id": "unique-id",
      "title": "Tiêu đề bài viết",
      "description": "Mô tả ngắn gọn",
      "content": "Nội dung chi tiết...",
      "url": "https://original-article-url.com",
      "image_url": "https://image-url.com/image.jpg",
      "published_at": "2025-12-10T10:00:00Z",
      "source_name": "Tên nguồn tin",
      "author": "Tên tác giả",
      "category": "food"
    }
  ],
  "total": 15,
  "source": "newsapi"
}
```

## Tính Năng Kỹ Thuật

### 1. Caching

API sử dụng caching để tối ưu hiệu suất và tiết kiệm quota của NewsAPI:

- **TTL (Time To Live)**: 5 phút
- **Cache Key**: Dựa trên `category` và `limit`
- **Khi Cache Hết Hạn**: Tự động gọi lại NewsAPI

```python
# Trong articles.py
cache: Dict[str, Tuple[List[Article], datetime]] = {}
CACHE_TTL = timedelta(minutes=5)
```

### 2. Timeout Handling

Để tránh request bị treo quá lâu:

- **Backend timeout**: 30 giây (khi gọi NewsAPI)
- **Frontend timeout**: 10 giây (khi gọi backend API)

```python
# Backend: articles.py
response = requests.get(url, params=params, timeout=30)
```

```typescript
// Frontend: api.ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);
```

### 3. Data Validation & Filtering

Backend tự động lọc các bài viết không hợp lệ:

- ✅ **Loại bỏ**: Bài viết có `title` hoặc `description` là `null`
- ✅ **Loại bỏ**: Bài viết có nội dung `[Removed]` (bài bị xóa)
- ✅ **Đảm bảo**: Mỗi bài viết có đầy đủ thông tin cần thiết

```python
def is_valid_article(article: dict) -> bool:
    if not article.get("title") or not article.get("description"):
        return False
    if article.get("title") == "[Removed]":
        return False
    return True
```

### 4. Fallback Mechanism

Frontend có cơ chế dự phòng khi NewsAPI gặp sự cố:

1. **Bước 1**: Thử gọi NewsAPI
2. **Bước 2**: Nếu thất bại, tự động chuyển sang Supabase
3. **Bước 3**: Hiển thị thông báo cho người dùng

```typescript
// news.tsx
try {
  articlesData = await fetchArticles('newsapi', selectedCategory, 15);
} catch (error) {
  console.log('NewsAPI failed, falling back to Supabase');
  articlesData = await fetchArticles('supabase', selectedCategory, 15);
}
```

## Frontend Implementation

### 1. News List Screen (`news.tsx`)

Màn hình hiển thị danh sách tin tức:

- **Pull-to-refresh**: Kéo xuống để làm mới
- **Category filter**: Lọc theo danh mục (All, Food, Cooking, Recipe, Nutrition)
- **Navigation**: Click vào bài viết để xem chi tiết

### 2. Article Detail Screen (`article/[id].tsx`)

Màn hình hiển thị chi tiết bài viết:

- **Header**: Nút back, share, và mở link gốc
- **Image**: Hiển thị ảnh đại diện với fallback
- **Content**: Hiển thị nội dung đầy đủ
- **Footer**: Thông tin nguồn, tác giả, ngày xuất bản

**Navigation:**

```typescript
// Từ news.tsx
router.push({
  pathname: '/article/[id]',
  params: {
    id: article.id,
    articleData: JSON.stringify(article)
  }
});
```

## Troubleshooting

### 1. API Key Không Hoạt Động

**Triệu chứng**: Backend báo lỗi `401 Unauthorized` hoặc `403 Forbidden`

**Giải pháp**:
1. Kiểm tra API key trong `backend/.env` có chính xác không
2. Đảm bảo API key chưa hết hạn tại [NewsAPI Dashboard](https://newsapi.org/account)
3. Kiểm tra quota còn lại (Free plan: 100 requests/ngày)
4. Khởi động lại backend server:
   ```bash
   cd backend
   deactivate  # Nếu venv đang chạy
   venv\Scripts\Activate.ps1
   uvicorn main:app --reload
   ```

### 2. Cache Không Cập Nhật

**Triệu chứng**: Tin tức không cập nhật sau 5 phút

**Giải pháp**:
1. Kiểm tra thời gian cache trong `articles.py`
2. Tạm thời tắt cache để test:
   ```python
   # Đổi TTL thành 0
   CACHE_TTL = timedelta(minutes=0)
   ```
3. Hoặc clear cache thủ công:
   ```python
   cache.clear()
   ```

### 3. Timeout Errors

**Triệu chứng**: Request bị timeout sau 10 giây

**Giải pháp**:
1. Kiểm tra kết nối mạng
2. Tăng timeout nếu cần:
   ```typescript
   // api.ts - Tăng từ 10s lên 15s
   const timeoutId = setTimeout(() => controller.abort(), 15000);
   ```
3. Sử dụng fallback sang Supabase

### 4. Hình Ảnh Không Hiển Thị

**Triệu chứng**: Bài viết hiển thị nhưng không có hình

**Giải pháp**:
1. Kiểm tra URL hình ảnh có hợp lệ không
2. Thêm fallback image:
   ```typescript
   <Image
     source={{ uri: article.image_url || 'https://placeholder-url.com' }}
     onError={() => setImageError(true)}
   />
   ```

### 5. IP Address Thay Đổi

**Triệu chứng**: Frontend không kết nối được backend sau khi đổi mạng WiFi

**Giải pháp**:
1. Kiểm tra IP hiện tại:
   ```bash
   ipconfig | Select-String -Pattern "IPv4"
   ```
2. Cập nhật IP trong `frontend/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_NEW_IP:8000/api';
   ```
3. Khởi động lại Expo:
   ```bash
   npx expo start --clear
   ```

## Best Practices

### 1. Bảo Mật API Key

- ✅ **LUÔN** lưu API key trong `.env`
- ❌ **KHÔNG BAO GIỜ** commit `.env` lên git
- ✅ **LUÔN** sử dụng `.env.example` làm template
- ✅ **LUÔN** kiểm tra `.gitignore` có chứa `.env`

### 2. Tối Ưu Performance

- ✅ Sử dụng caching để giảm số lượng request
- ✅ Set timeout hợp lý (10-30 giây)
- ✅ Implement fallback mechanism
- ✅ Filter dữ liệu không hợp lệ ở backend

### 3. User Experience

- ✅ Hiển thị loading state khi fetch data
- ✅ Implement pull-to-refresh
- ✅ Hiển thị error message rõ ràng
- ✅ Cung cấp fallback image cho bài viết không có ảnh

## Quota & Limits

### NewsAPI Free Plan

- **Requests**: 100 requests/ngày
- **Results**: Tối đa 100 bài viết/request
- **Caching**: 5 phút TTL → Tiết kiệm quota

### Tính Toán Quota

Với cache 5 phút:
- **Scenario 1**: 10 người dùng, mỗi người xem 1 lần/giờ → 12 requests/ngày
- **Scenario 2**: 50 người dùng, mỗi người xem 2 lần/giờ → 50 requests/ngày

**Khuyến nghị**: Nếu app có nhiều người dùng, nên nâng cấp lên paid plan hoặc tăng cache TTL lên 15-30 phút.

## Tài Liệu Tham Khảo

- [NewsAPI Documentation](https://newsapi.org/docs)
- [NewsAPI Endpoints](https://newsapi.org/docs/endpoints)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## Changelog

### Version 1.0 (December 10, 2025)

- ✅ Tích hợp NewsAPI với backend
- ✅ Implement caching (5 phút TTL)
- ✅ Thêm data validation & filtering
- ✅ Tạo article detail page
- ✅ Implement timeout handling
- ✅ Thêm fallback mechanism
- ✅ Bảo mật API key với .env

---

**Tác giả**: FoodApp Development Team  
**Ngày cập nhật**: December 10, 2025

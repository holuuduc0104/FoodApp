# 🚀 Hướng dẫn chạy FoodApp

## ✅ Đã fix lỗi:
- **Cập nhật IP address** từ `192.168.1.30` → `192.168.1.134`
- **Thêm timeout handling** (15 giây)
- **Cải thiện error messages** hiển thị lỗi rõ ràng hơn
- **Tích hợp NewsAPI** để lấy tin tức thực tế về food/cooking

---

## 📋 Yêu cầu:
- Python 3.10+
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator / Physical device

---

## 🔧 Bước 1: Kiểm tra IP của máy

Chạy command này để lấy IP:
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

Nếu IP khác `192.168.1.134`, cập nhật trong file:
- `frontend/services/api.ts` → dòng 3: `const API_BASE_URL = 'http://YOUR_IP:8000/api';`

---

## 🐍 Bước 2: Chạy Backend

Mở **PowerShell Terminal 1**:
```powershell
cd "d:\Da_nen_tang\Bai_tap_lon\FoodApp\backend"
.\venv\Scripts\Activate.ps1
python main.py
```

**Backend sẽ chạy tại:** http://0.0.0.0:8000

**Kiểm tra API:**
- Docs: http://localhost:8000/docs
- Test: http://192.168.1.134:8000/api/articles?source=newsapi&limit=5

---

## 📱 Bước 3: Chạy Frontend

Mở **PowerShell Terminal 2** (hoặc Terminal mới):
```powershell
cd "d:\Da_nen_tang\Bai_tap_lon\FoodApp\frontend"
npm start
```

Sau đó:
- Nhấn **`a`** → Android emulator
- Nhấn **`i`** → iOS simulator (chỉ macOS)
- **Quét QR code** → Expo Go app trên điện thoại

---

## 🔍 Kiểm tra lỗi:

### Lỗi: "Network request failed"
**Nguyên nhân:**
1. Backend chưa chạy
2. IP address sai
3. Firewall chặn port 8000

**Cách fix:**
```powershell
# 1. Kiểm tra backend đang chạy:
curl http://localhost:8000/api/articles?source=newsapi&limit=5

# 2. Kiểm tra IP:
ipconfig | Select-String "IPv4"

# 3. Tắt Firewall tạm thời hoặc allow port 8000
```

### Lỗi: "Request timeout"
- Kiểm tra kết nối internet (NewsAPI cần internet)
- API key NewsAPI có thể hết quota (miễn phí 100 requests/ngày)

---

## 🎯 API Endpoints:

### Articles (NewsAPI)
- `GET /api/articles?source=newsapi&limit=20` - Lấy tin tức
- `GET /api/articles/featured?source=newsapi&limit=5` - Tin nổi bật

### Articles (Supabase - Local)
- `GET /api/articles?source=supabase` - Dữ liệu local
- `GET /api/articles/featured?source=supabase` - Tin nổi bật local

---

## 📌 Ghi chú:

### NewsAPI Key
- Đã cấu hình sẵn: `871313d61c9045cb9537d2e914d8e004`
- Limit: 100 requests/ngày (free tier)
- Nếu hết quota → chuyển sang `source=supabase`

### Frontend Features:
✅ Load tin tức từ NewsAPI  
✅ Hiển thị nguồn (BBC, CNN, etc.)  
✅ Click vào bài → mở link gốc  
✅ Pull to refresh  
✅ Error handling với thông báo rõ ràng  

---

## 🛠️ Troubleshooting:

### Backend không start:
```powershell
# Kiểm tra port 8000 có đang dùng không
netstat -ano | findstr :8000

# Kill process nếu cần
taskkill /PID <PID> /F
```

### Frontend không kết nối:
1. Đảm bảo máy tính và điện thoại cùng mạng WiFi
2. Kiểm tra IP trong `services/api.ts`
3. Test API trước: http://YOUR_IP:8000/docs

### Module not found:
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 🎉 Khi mọi thứ hoạt động:

1. Backend log sẽ hiển thị: `INFO: Application startup complete.`
2. Frontend hiển thị tin tức thực tế từ NewsAPI
3. Click vào bài viết → mở browser với link gốc
4. Pull down để refresh tin mới

**Chúc bạn thành công! 🚀**

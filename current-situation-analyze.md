# Phân tích tình trạng hiện tại của dự án Rent City

Tài liệu này là snapshot hiện tại của project sau các thay đổi user/auth gần đây.

## 1. Tổng quan

Rent City hiện gồm hai phần:

- Backend: Spring Boot, Java 21, PostgreSQL, JPA, Spring Security, JWT.
- Frontend: React, TypeScript, Vite, Tailwind CSS, Axios, React Router.

Thư mục chính:

- `src/main/java`: backend Spring Boot.
- `src/main/resources/application.yml`: cấu hình backend.
- `frontend/src`: frontend React.
- `docker-compose.yml`: PostgreSQL local.
- `pom.xml`: Maven backend.
- `frontend/package.json`: npm scripts và dependencies frontend.

Git hiện có nhiều thay đổi local. Lưu ý `frontend/package-lock.json` đã modified từ trước khi bắt đầu phần user/auth.

## 2. Backend hiện tại

### 2.1. Stack

- Spring Boot `3.5.14`
- Java `21`
- Spring Web
- Spring Data JPA
- Spring Validation
- Spring Security
- PostgreSQL driver
- Lombok
- JJWT `0.11.5`

### 2.2. Cấu hình local

Backend chạy với context path:

```yaml
server:
  servlet:
    context-path: /api
```

Database local:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rentcity
    username: postgres
    password: password
```

Hiện `application.yml` đang active profile:

```yaml
spring:
  profiles:
    active: dev
```

Profile `dev` dùng để seed tài khoản demo local. Nếu muốn cấu hình sạch hơn, có thể bỏ active mặc định và chạy profile dev bằng command riêng.

### 2.3. Domain backend đã có

Entity:

- `User`
- `TokenBlacklist`
- `UserDocument`

Repository:

- `UserRepository`
- `TokenBlacklistRepository`
- `UserDocumentRepository`

Service:

- `AuthService`
- `UserService`
- `JwtService`

Controller:

- `AuthController`
- `UserController`

Config mới liên quan local:

- `DevDataSeeder`
- `WebConfig`

### 2.4. Endpoint backend hiện có

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

User:

- `GET /api/users/me`
- `PUT /api/users/update`
- `PUT /api/users/me/password`
- `GET /api/users/documents`
- `POST /api/users/upload-document`

Local upload:

- `GET /api/uploads/**`

Chưa có backend cho:

- Vehicle/catalog/search.
- Booking.
- Payment.
- Notification.
- Review.
- Admin vehicle management.
- Admin booking management.

### 2.5. Auth/security

Security hiện:

- Public: `/auth/register`, `/auth/login`, `/auth/refresh`.
- Public local files: `/uploads/**`.
- Các request còn lại cần authenticated.
- Stateless session.
- JWT filter đọc Authorization header.
- Logout đưa access token vào blacklist.
- CORS cho `http://localhost:5173` và `http://localhost:3000`.

Rủi ro còn lại:

- Refresh token chưa có persistence/rotation riêng.
- Token blacklist chưa có cleanup expired token.
- Chưa có role-level authorization chi tiết cho từng endpoint.

## 3. Frontend hiện tại

### 3.1. Stack

- React `19`
- Vite `8`
- TypeScript `5.9`
- React Router `7`
- Axios
- Tailwind CSS `4`
- Lucide React
- Framer Motion
- Sonner toast

### 3.2. Routing chính

Public:

- `/`
- `/search`
- `/vehicles/:id`

Customer protected:

- `/booking/:id`
- `/booking/:id/confirm`
- `/booking/:id/payment`
- `/booking/:id/result`
- `/my-bookings`
- `/my-bookings/:id`

Authenticated:

- `/profile`
- `/notifications`

Admin/staff:

- `/admin`
- `/admin/vehicles`
- `/admin/bookings`

### 3.3. Data/API hiện tại

Đã gọi backend thật:

- Login/register/logout/refresh.
- Restore current user bằng `/users/me`.
- Get/update profile.
- Upload/list user documents.

Vẫn dùng mock/local state:

- Vehicle list/search/detail.
- Booking flow.
- Payment screens.
- Notifications.
- Admin vehicle/booking pages.

Auth frontend hiện là API-only. `MOCK_USERS` không còn được dùng trong luồng đăng nhập chính.

### 3.4. User model

Backend trả `ApiUser`, frontend dùng `mapApiUserToUser` để tạo `User` UI model.

Mapper bổ sung field UI-only:

- `status`
- `loyaltyPoints`
- `tier`
- `avatarUrl`
- `createdAt`
- `updatedAt`

Điểm cần chú ý: nếu backend đổi `UserResponse`, phải cập nhật `ApiUser` và mapper.

### 3.5. Profile validation UX

Profile update hiện có hai lớp validation:

- Client-side validation trong `ProfilePage`.
- Backend validation qua `ProfileUpdateRequest`.

Khi field sai:

- Input chuyển nền/border đỏ.
- Message lỗi hiển thị ngay dưới input.
- Toast chỉ báo tổng quát.

Ví dụ phone sai rule `^0\\d{9}$` sẽ hiện lỗi trực tiếp ở Phone Number.

## 4. Kết quả kiểm tra local

### 4.1. Backend

Lệnh:

```powershell
.\mvnw.cmd test
```

Kết quả:

- Pass.
- Tests run: 1.
- Test hiện là smoke test `contextLoads`.

Lưu ý:

- Test dùng PostgreSQL local.
- Hibernate có thể tạo/cập nhật schema vì `ddl-auto: update`.
- Profile `dev` active nên seeder kiểm tra/tạo demo users.

### 4.2. Frontend

Targeted checks đã pass:

```powershell
npx eslint src\pages\ProfilePage\index.tsx
```

Targeted ESLint cho các file user/auth đã sửa cũng pass.

Full project vẫn chưa pass:

- `npm run build` fail do lỗi cũ ở booking/pricing/vehicle.
- `npm run lint` fail do lỗi cũ ngoài user/auth.

Các lỗi build chính còn lại:

- `BookingSidebar.tsx`: unused `totalDays`.
- `VehicleCard.tsx`: unused `MapPin`.
- `usePricing.ts`: type inference chỉ nhận `HOURLY | DAILY`, nhưng code push `WEEKLY`, `MONTHLY`, `MIXED`.

Các lỗi lint chính còn lại:

- `usePricing.ts`: unused `err`.
- `VehicleModal.tsx`: React hooks rule `set-state-in-effect`.
- `SearchPage`: `prefer-const`.
- `bookingStore.tsx`: `react-refresh/only-export-components`.

## 5. Điểm mạnh hiện tại

- Backend auth/JWT đã có nền tảng rõ.
- Frontend auth đã chuyển sang API thật.
- Profile đã dùng backend cho user/document.
- Có seed demo users phục vụ local.
- Upload file local hoạt động qua `/api/uploads/**`.
- Profile validation UX đã tốt hơn: field lỗi được highlight đỏ.
- Backend smoke test pass.

## 6. Rủi ro và việc nên xử lý tiếp

### 6.1. Frontend/backend lệch phạm vi

Frontend có nhiều màn hình domain, nhưng backend mới có user/auth và document local. Các flow xe, booking, payment, admin vẫn chủ yếu là mock.

### 6.2. Frontend build chưa sạch

Cần xử lý các lỗi TypeScript/lint ngoài user/auth trước khi coi frontend ổn định.

### 6.3. Dev profile active mặc định

Điều này tiện cho local seed users, nhưng có thể gây nhầm. Nên cân nhắc chuyển sang `application-dev.yml` hoặc command chạy riêng.

### 6.4. Test coverage thấp

Cần thêm test cho:

- Register/login.
- Refresh token.
- Update profile validation.
- Upload/list document.
- Frontend profile validation UI.

### 6.5. Storage local chỉ là stub

`uploads` chỉ phù hợp local development. Khi đi xa hơn cần thiết kế storage thật, ví dụ S3, Cloudinary hoặc local storage có cleanup/quota.

## 7. Hướng phát triển đề xuất

1. Làm sạch frontend build/lint.
2. Thêm test cho user/auth.
3. Quyết định lại cách bật `dev` profile.
4. Bắt đầu backend API cho vehicle/search.
5. Sau đó mở rộng booking/payment/admin APIs.

## 8. Ghi chú vận hành local

- Backend API base URL: `http://localhost:8080/api`
- Frontend Vite thường chạy: `http://localhost:5173`
- PostgreSQL local: database `rentcity`, user `postgres`, password `password`
- Demo users: `customer@demo.com`, `staff@demo.com`, `admin@demo.com`
- Demo password: `Password123`
- Upload folder local: `uploads`


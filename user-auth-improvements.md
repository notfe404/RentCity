# Kế hoạch cải thiện User/Auth cho local development

Tài liệu này ghi lại kế hoạch và trạng thái hiện tại của phần user/auth trong Rent City. Phạm vi chỉ dành cho local development, không nhắm đến production hardening.

## 1. Mục tiêu

- Dùng API auth thật cho local, không dùng mock login trong luồng chính.
- Giữ session ổn định sau khi reload.
- Profile dùng API thật để lấy/cập nhật user.
- Upload/list document hoạt động bằng backend local.
- Validation lỗi trong profile phải hiển thị rõ ở đúng input, không chỉ bằng toast.
- Các type frontend phải khớp hoặc có mapper rõ ràng với response backend.

## 2. Những phần đã hoàn thành

### 2.1. API-only auth

Frontend auth đã bỏ luồng login bằng `MOCK_USERS`.

Luồng hiện tại:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/users/me` để restore session

Tài khoản demo local được seed từ backend:

- `customer@demo.com / Password123`
- `staff@demo.com / Password123`
- `admin@demo.com / Password123`

File chính:

- `frontend/src/store/authStore.tsx`
- `frontend/src/services/api.ts`
- `src/main/java/com/rentcity/Rentcity/config/DevDataSeeder.java`

### 2.2. User contract và mapper

Backend trả về `ApiUser`, frontend dùng mapper để chuyển sang `User` UI model.

Đã thêm:

- `ApiUser`
- `KycStatus`
- `mapApiUserToUser(apiUser)`

Mapper bổ sung các field frontend cần nhưng backend chưa có:

- `status`
- `loyaltyPoints`
- `tier`
- `avatarUrl`
- `createdAt`
- `updatedAt`

File chính:

- `frontend/src/types/user.types.ts`
- `frontend/src/utils/userMapper.ts`

### 2.3. Current user endpoint

Frontend restore session đã chuyển sang:

- `GET /api/users/me`

`GET /api/auth/me` vẫn còn ở backend, nhưng không còn là endpoint chính phía frontend.

### 2.4. Document upload/list bằng backend local

Đã thêm backend stub cho document:

- `GET /api/users/documents`
- `POST /api/users/upload-document`

File upload được lưu ở thư mục:

- `uploads`

File được serve public qua:

- `/api/uploads/**`

File chính:

- `src/main/java/com/rentcity/Rentcity/entity/UserDocument.java`
- `src/main/java/com/rentcity/Rentcity/repository/UserDocumentRepository.java`
- `src/main/java/com/rentcity/Rentcity/dto/UserDocumentResponse.java`
- `src/main/java/com/rentcity/Rentcity/config/WebConfig.java`
- `src/main/java/com/rentcity/Rentcity/service/UserService.java`
- `src/main/java/com/rentcity/Rentcity/controller/UserController.java`

### 2.5. Profile update validation

Backend đã validate `ProfileUpdateRequest`:

- `fullName`: 2-100 ký tự
- `phone`: đúng 10 chữ số và bắt đầu bằng `0`
- `idCardUrl`: tối đa 500 ký tự

Frontend `ProfilePage` đã có:

- Client-side validation trước khi gọi API.
- Mapping lỗi backend validation về đúng field.
- Input lỗi chuyển sang nền/border đỏ.
- Message lỗi hiển thị ngay dưới input.
- Toast chỉ đóng vai trò thông báo tổng quát.

Ví dụ khi nhập phone sai như `0901234567a`, field Phone Number sẽ chuyển đỏ và hiển thị message inline.

File chính:

- `src/main/java/com/rentcity/Rentcity/dto/ProfileUpdateRequest.java`
- `frontend/src/pages/ProfilePage/index.tsx`

### 2.6. Refresh token an toàn hơn

Axios interceptor đã xử lý rõ hơn:

- Gắn access token cho request API.
- Không refresh cho login/register/refresh.
- Nếu thiếu refresh token thì clear local session.
- Nếu refresh fail thì clear token và quay về `/`.

File chính:

- `frontend/src/services/api.ts`

## 3. Những phần còn cần làm

### 3.1. Chuẩn hóa error response

Backend hiện vẫn trả hai dạng lỗi:

- Validation: `{ fieldName: message }`
- Business error: `{ error: message }`

Nên chuẩn hóa sau này thành một format dễ parse hơn, ví dụ:

```json
{
  "message": "Validation failed",
  "errors": {
    "phone": "Phone number must have exactly 10 digits and start with 0"
  }
}
```

### 3.2. Dọn encoding/mojibake còn lại

Phần user/auth backend đã được đổi nhiều message sang tiếng Anh ổn định. Tuy nhiên một số file frontend khác vẫn còn mojibake trong comment/text cũ. Nên xử lý theo từng màn hình khi refactor.

### 3.3. Quyết định lại dev profile

Hiện `application.yml` đang active profile `dev` mặc định để seed tài khoản demo local.

Nếu muốn rõ ràng hơn, có thể chuyển sang cách chạy thủ công:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

Hoặc tách cấu hình local sang `application-dev.yml`.

### 3.4. Test coverage

Nên thêm test cho:

- Register thành công.
- Register trùng email/phone.
- Login đúng/sai credential.
- Refresh token.
- Update profile validation.
- Upload/list document local.

## 4. Verification hiện tại

Đã chạy:

- `.\mvnw.cmd test`: pass.
- `npx eslint src\pages\ProfilePage\index.tsx`: pass.
- Targeted ESLint cho các file auth/user đã sửa: pass.

Chưa pass toàn project:

- `npm run build` vẫn fail do lỗi cũ ở booking/pricing/vehicle.
- `npm run lint` vẫn fail do lỗi cũ ngoài user/auth.

## 5. Tiêu chí hoàn thành user/auth local

- Reload sau login vẫn giữ session.
- Login/register dùng backend local.
- Tài khoản demo backend login được bằng `Password123`.
- Profile load được user từ `/users/me`.
- Update profile thành công cập nhật UI và backend.
- Input sai validation hiển thị đỏ và có message inline.
- Document upload/list hoạt động qua backend local.
- Logout clear token và user state.
- User/auth files không còn lỗi ESLint.


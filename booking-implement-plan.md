# Kế hoạch triển khai chức năng Booking

Tài liệu này mô tả kế hoạch triển khai đầy đủ cho chức năng booking trong Rent City, bao gồm backend, frontend, business rule, state machine, kiểm tra trùng lịch, pessimistic lock, và tự động hủy booking sau 15 phút nếu chưa hoàn thành đặt cọc.

## 1. Mục tiêu tính năng

Cho phép khách hàng:

- Đặt xe theo một khoảng thời gian.
- Khoảng thời gian có thể tính theo giờ, ngày hoặc tháng.
- Thanh toán tiền đặt cọc để giữ xe.
- Xem danh sách booking của chính mình.
- Hủy booking theo rule thời gian và biết có bị mất cọc hay không.

Cho phép hệ thống:

- Kiểm tra trùng lịch để tránh double booking.
- Dùng pessimistic lock để tránh 2 khách cùng book cùng lúc.
- Dùng state machine để kiểm soát vòng đời booking.
- Tự động hủy booking sau 15 phút nếu chưa hoàn thành đặt cọc.

Cho phép admin/staff:

- Xem toàn bộ booking.
- Theo dõi trạng thái booking.
- Thực hiện transition hợp lệ theo quy trình vận hành.

## 2. Business rule

### 2.1. Loại booking

- `HOURLY`
- `DAILY`
- `MONTHLY`

### 2.2. Tiền cọc

- Khi tạo booking, hệ thống tính `depositAmount`.
- Booking chỉ được giữ chỗ thực sự khi khách hoàn thành đặt cọc.
- Sau khi tạo booking, nếu quá 15 phút mà chưa hoàn thành đặt cọc thì booking tự động bị hủy.

### 2.3. Rule hủy booking

Nếu khách chủ động hủy:

- Booking theo giờ: phải hủy trước `startTime` ít nhất 1 giờ để không mất cọc.
- Booking theo ngày: phải hủy trước `startTime` ít nhất 1 ngày để không mất cọc.
- Booking theo tháng: phải hủy trước `startTime` ít nhất 1 ngày theo đúng yêu cầu hiện tại của bạn.

Nếu hủy sau ngưỡng trên:

- booking bị hủy
- tiền cọc bị mất

Nếu booking bị hệ thống tự động hủy sau 15 phút do chưa đặt cọc:

- booking bị hủy
- không có chuyện mất cọc vì khách chưa thanh toán cọc

### 2.4. Trùng lịch

Không cho phép tồn tại 2 booking cùng giữ một xe trong cùng một khoảng thời gian nếu booking kia đang ở trạng thái còn chiếm lịch.

Điều kiện overlap:

```text
newStart < existingEnd AND newEnd > existingStart
```

Các trạng thái được xem là đang chiếm lịch:

- `PENDING`
- `CONFIRMED`
- `ONGOING`

Các trạng thái không còn chiếm lịch:

- `COMPLETED`
- `CANCELLED`

Lưu ý:

- `PENDING` vẫn phải chiếm lịch trong 15 phút timeout để tránh 2 người cùng tạo booking trong lúc một người đang đi thanh toán cọc.

## 3. State machine

### 3.1. Trạng thái booking

- `PENDING`
- `CONFIRMED`
- `ONGOING`
- `COMPLETED`
- `CANCELLED`

### 3.2. Ý nghĩa

- `PENDING`: booking vừa tạo, đang chờ khách hoàn thành đặt cọc.
- `CONFIRMED`: khách đã đặt cọc thành công, booking được xác nhận.
- `ONGOING`: khách đã nhận xe, booking đang diễn ra.
- `COMPLETED`: booking đã kết thúc.
- `CANCELLED`: booking bị hủy bởi khách, admin, hoặc hệ thống timeout.

### 3.3. Transition hợp lệ

```text
PENDING -> CONFIRMED
PENDING -> CANCELLED

CONFIRMED -> ONGOING
CONFIRMED -> CANCELLED

ONGOING -> COMPLETED
ONGOING -> CANCELLED
```

Không cho phép:

- `PENDING -> ONGOING`
- `PENDING -> COMPLETED`
- `CONFIRMED -> COMPLETED`
- `COMPLETED -> bất kỳ`
- `CANCELLED -> bất kỳ`

### 3.4. Transition tự động

Hệ thống cần có transition tự động:

```text
PENDING -> CANCELLED
```

Điều kiện:

- `createdAt + 15 phút < now`
- booking chưa hoàn thành đặt cọc

Lý do:

- `PAYMENT_TIMEOUT`

## 4. Domain model backend

### 4.1. Entity `Booking`

Field đề xuất:

- `id`
- `bookingCode`
- `userId`
- `vehicleId`
- `startTime`
- `endTime`
- `pricingMode`
- `status`
- `depositStatus`
- `baseAmount`
- `depositAmount`
- `totalAmount`
- `freeCancelUntil`
- `cancelledAt`
- `cancelReason`
- `cancelledBy`
- `createdAt`
- `updatedAt`

### 4.2. Enum `BookingStatus`

- `PENDING`
- `CONFIRMED`
- `ONGOING`
- `COMPLETED`
- `CANCELLED`

### 4.3. Enum `PricingMode`

- `HOURLY`
- `DAILY`
- `MONTHLY`

### 4.4. Enum `DepositStatus`

- `UNPAID`
- `PAID`
- `FORFEITED`
- `REFUNDED`
- `NOT_REQUIRED`

### 4.5. Enum `BookingCancelReason`

- `CUSTOMER_CANCELLED`
- `ADMIN_CANCELLED`
- `PAYMENT_TIMEOUT`
- `SYSTEM_CANCELLED`

### 4.6. Entity `BookingStatusHistory`

Mục tiêu:

- audit lịch sử chuyển trạng thái
- phục vụ trace/debug

Field đề xuất:

- `id`
- `bookingId`
- `fromStatus`
- `toStatus`
- `changedByUserId`
- `changedByRole`
- `reason`
- `note`
- `createdAt`

## 5. Pricing và cancel policy

### 5.1. Pricing service

Tạo service riêng để tính:

- `baseAmount`
- `depositAmount`
- `totalAmount`
- `freeCancelUntil`

Interface gợi ý:

```java
BookingQuote calculateQuote(
    Vehicle vehicle,
    LocalDateTime startTime,
    LocalDateTime endTime,
    PricingMode pricingMode
)
```

### 5.2. Cancel policy service

Tạo service riêng:

```java
LocalDateTime calculateFreeCancelUntil(
    LocalDateTime startTime,
    PricingMode pricingMode
)
```

Rule:

- `HOURLY`: `startTime - 1 hour`
- `DAILY`: `startTime - 1 day`
- `MONTHLY`: `startTime - 1 day`

## 6. Chống double booking

### 6.1. Availability query

Repository cần query overlap theo:

- `vehicleId`
- `startTime`
- `endTime`
- `status in (PENDING, CONFIRMED, ONGOING)`

Ví dụ logic:

```sql
exists booking
where vehicle_id = :vehicleId
  and status in ('PENDING', 'CONFIRMED', 'ONGOING')
  and :startTime < end_time
  and :endTime > start_time
```

### 6.2. Thời điểm check

Phải check overlap trong transaction lúc tạo booking.

Không chỉ check ở frontend.

Frontend chỉ hiển thị nhanh, backend mới là nguồn sự thật.

## 7. Pessimistic lock

### 7.1. Mục tiêu

Tránh trường hợp:

- 2 khách bấm book cùng một xe gần như cùng lúc
- cả hai đều qua bước check availability trước khi một trong hai commit

### 7.2. Cách làm

Khi tạo booking:

1. Begin transaction.
2. Lock row của xe bằng `PESSIMISTIC_WRITE`.
3. Check overlap booking trong transaction đó.
4. Nếu không trùng lịch thì tạo booking `PENDING`.
5. Commit transaction.

Repository gợi ý:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select v from Vehicle v where v.id = :id")
Optional<Vehicle> findByIdForUpdate(Long id);
```

### 7.3. Lý do lock vào vehicle

Lock vào vehicle là đủ để serialize việc tạo booking trên cùng một xe. Đây là cách đơn giản và an toàn hơn so với cố lock toàn bộ booking rows theo khoảng thời gian.

## 8. Auto-cancel sau 15 phút nếu chưa đặt cọc

### 8.1. Rule

Mỗi booking mới tạo ở trạng thái `PENDING`.

Nếu sau 15 phút kể từ `createdAt` mà vẫn:

- `status = PENDING`
- `depositStatus = UNPAID`

thì hệ thống tự động:

- chuyển `status = CANCELLED`
- set `cancelReason = PAYMENT_TIMEOUT`
- ghi `BookingStatusHistory`

### 8.2. Cách triển khai

Có 2 lựa chọn kỹ thuật:

1. Scheduled job chạy mỗi 1 phút:
   - query các booking quá hạn
   - cancel từng booking trong transaction

2. Delayed job / queue:
   - khi tạo booking thì enqueue task check timeout sau 15 phút

Khuyến nghị cho project hiện tại:

- dùng scheduled job trước

Lý do:

- đơn giản hơn
- đủ tốt cho local/dev và giai đoạn đầu

### 8.3. Scheduled job đề xuất

Ví dụ:

```java
@Scheduled(fixedDelay = 60000)
public void cancelExpiredPendingBookings() { ... }
```

Service sẽ:

- lấy booking `PENDING` + `UNPAID` quá hạn
- gọi state machine transition sang `CANCELLED`
- set `cancelReason = PAYMENT_TIMEOUT`

### 8.4. Concurrency cho timeout job

Khi scheduled job chạy:

- nên lock booking record hoặc update trong transaction
- re-check trạng thái trước khi cancel

để tránh race condition nếu khách vừa thanh toán cọc đúng lúc job chạy.

## 9. Backend API design

### 9.1. Customer APIs

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/{id}`
- `POST /api/bookings/{id}/pay-deposit`
- `POST /api/bookings/{id}/cancel`

### 9.2. Admin APIs

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/{id}`
- `POST /api/admin/bookings/{id}/transition`

### 9.3. Create booking request

```json
{
  "vehicleId": 1,
  "startTime": "2026-06-01T09:00:00",
  "endTime": "2026-06-01T17:00:00",
  "pricingMode": "HOURLY"
}
```

### 9.4. Booking response

```json
{
  "id": 10,
  "bookingCode": "RC-20260601-0010",
  "vehicleId": 1,
  "status": "PENDING",
  "depositStatus": "UNPAID",
  "depositAmount": 300000,
  "totalAmount": 1000000,
  "freeCancelUntil": "2026-06-01T08:00:00",
  "paymentDeadline": "2026-06-01T09:15:00"
}
```

### 9.5. List booking APIs

Customer:

- `GET /api/bookings/my`
- chỉ trả booking của user hiện tại

Admin:

- `GET /api/admin/bookings`
- trả tất cả booking
- nên hỗ trợ filter sau:
  - `status`
  - `vehicleId`
  - `userId`
  - `from`
  - `to`

## 10. Backend services cần có

- `BookingPricingService`
- `BookingAvailabilityService`
- `BookingStateMachineService`
- `BookingCancellationPolicyService`
- `BookingService`
- `BookingTimeoutJobService`

## 11. Validation backend

### 11.1. Khi tạo booking

- `vehicleId` phải tồn tại
- `startTime < endTime`
- `startTime` phải ở tương lai
- `pricingMode` hợp lệ
- thời lượng phải phù hợp với mode:
  - `HOURLY`: nên lớn hơn 0 giờ
  - `DAILY`: nên tối thiểu 1 ngày
  - `MONTHLY`: nên tối thiểu 1 tháng hoặc theo rule business bạn chốt

### 11.2. Khi thanh toán đặt cọc

- chỉ cho `PENDING`
- chỉ cho booking chưa quá 15 phút
- nếu đã bị `CANCELLED` do timeout thì reject

### 11.3. Khi hủy booking

- chỉ cho `PENDING` hoặc `CONFIRMED`
- không cho hủy `COMPLETED`
- `ONGOING` chỉ cho staff/admin xử lý nếu business cho phép

## 12. Frontend integration plan

### 12.1. Màn customer

Nối API vào các page hiện có:

- `BookingPage`
  - chọn thời gian
  - tạo booking
- `BookingConfirmPage`
  - hiển thị quote, deposit, deadline thanh toán
- `PaymentPage`
  - gọi API thanh toán cọc
- `MyBookingsPage`
  - gọi `GET /api/bookings/my`
- `BookingDetailPage`
  - gọi `GET /api/bookings/{id}`
  - hiển thị trạng thái, mốc thời gian, deadline hủy miễn phí

### 12.2. Màn admin

- `AdminBookings`
  - gọi `GET /api/admin/bookings`
  - hiển thị danh sách toàn bộ booking
  - filter theo status/date/customer/vehicle

### 12.3. UX cần hiển thị rõ

- trạng thái booking
- trạng thái cọc
- thời hạn hoàn thành đặt cọc trong 15 phút
- thời hạn hủy miễn phí
- nếu trùng lịch thì báo lỗi rõ
- nếu booking đã timeout thì báo booking đã tự động hủy

## 13. Phased implementation

### Phase 1 - Backend booking core

- Tạo enums
- Tạo entity `Booking`
- Tạo entity `BookingStatusHistory`
- Tạo repository
- Tạo overlap query
- Tạo pessimistic lock cho vehicle
- Tạo state machine service
- Tạo create booking API
- Tạo list booking của user

### Phase 2 - Deposit và timeout

- Tạo `depositStatus`
- Tạo API `pay-deposit`
- Tạo scheduled job auto-cancel sau 15 phút
- Tạo cancel policy service
- Tạo cancel booking API

### Phase 3 - Admin flow và frontend integration

- Tạo API admin list all bookings
- Tạo API admin transition booking
- Nối API vào frontend customer pages
- Nối API vào frontend admin pages

### Phase 4 - Hardening

- Test concurrency
- Test overlap edge cases
- Add pagination/filter/sort
- Chuẩn hóa error response
- Thêm logging/audit

## 14. Test plan

### 14.1. Backend unit/integration test

- Tạo booking hợp lệ thành công
- Tạo booking với `endTime <= startTime` bị reject
- Tạo booking trùng lịch bị reject
- Hai request đồng thời book cùng một xe:
  - chỉ 1 request thành công
- `PENDING -> CONFIRMED` hợp lệ
- `PENDING -> ONGOING` bị reject
- `CONFIRMED -> COMPLETED` bị reject
- Hủy trước deadline:
  - `depositStatus = REFUNDED`
- Hủy sau deadline:
  - `depositStatus = FORFEITED`
- Quá 15 phút chưa cọc:
  - auto transition sang `CANCELLED`
  - `cancelReason = PAYMENT_TIMEOUT`
- User chỉ xem được booking của chính mình
- Admin xem được toàn bộ booking

### 14.2. Frontend test

- Tạo booking thành công
- Trùng lịch hiển thị lỗi rõ
- Thanh toán cọc đổi trạng thái UI từ `PENDING` sang `CONFIRMED`
- Timeout booking hiển thị đúng
- Danh sách booking của user hiển thị đúng
- Admin booking list hiển thị đúng

## 15. Các quyết định cần chốt sớm

Để triển khai ít vòng sửa, cần chốt sớm:

1. Công thức tính `depositAmount`
2. Công thức tính `totalAmount`
3. `MONTHLY` tối thiểu là 30 ngày hay theo lịch tháng thực
4. `MONTHLY` hủy miễn phí trước 1 ngày như yêu cầu hiện tại hay trước 1 tháng theo logic business chuẩn hơn
5. Có cho phép hủy khi `ONGOING` hay không
6. Có cần pagination cho list booking ngay từ đầu hay làm sau

## 16. Đề xuất thực thi ngay

Nếu bắt đầu code ngay, thứ tự đề xuất là:

1. Thiết kế entity + enums + repository
2. Làm create booking với overlap check + pessimistic lock
3. Làm state machine + status history
4. Làm pay deposit + timeout job 15 phút
5. Làm customer list booking + admin list all booking
6. Nối frontend customer trước, admin sau


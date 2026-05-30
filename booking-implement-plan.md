# Kế hoạch triển khai chức năng Booking

Tài liệu này mô tả kế hoạch triển khai đầy đủ cho chức năng booking trong Rent City, bao gồm backend, frontend, business rule, state machine, kiểm tra trùng lịch, pessimistic lock, và cách hỗ trợ xác nhận booking phục vụ test trước khi phần payment thật được hoàn tất.

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
- Cho phép xác nhận booking phục vụ test mà chưa cần tích hợp payment thật.

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
- Trong giai đoạn hiện tại, chưa triển khai auto-cancel theo timeout.
- Để phục vụ test flow booking trước khi payment hoàn tất, cần có cơ chế cho phép chuyển `PENDING -> CONFIRMED` mà không cần giao dịch thanh toán thật.

### 2.3. Rule hủy booking

Nếu khách chủ động hủy:

- Booking theo giờ: phải hủy trước `startTime` ít nhất 1 giờ để không mất cọc.
- Booking theo ngày: phải hủy trước `startTime` ít nhất 1 ngày để không mất cọc.
- Booking theo tháng: phải hủy trước `startTime` ít nhất 1 ngày theo đúng yêu cầu hiện tại của bạn.

Nếu hủy sau ngưỡng trên:

- booking bị hủy
- tiền cọc bị mất

Trong giai đoạn test hiện tại:

- booking `PENDING` có thể được xác nhận thủ công bởi admin/staff hoặc qua test endpoint nội bộ
- việc xác nhận này chỉ nhằm phục vụ test flow booking trước khi payment thật hoàn tất

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

- `PENDING` vẫn phải chiếm lịch để tránh 2 người cùng tạo booking trên cùng một xe trước khi booking được xác nhận hoặc hủy.

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

### 3.4. Transition phục vụ test

Trong giai đoạn payment chưa xong, cần hỗ trợ transition tạm thời:

```text
PENDING -> CONFIRMED
```

Điều kiện:

- chỉ dùng cho môi trường dev/test hoặc do admin/staff thao tác
- phải được đánh dấu rõ là xác nhận phục vụ test

Lý do:

- unblock việc test booking flow trước khi payment integration hoàn tất

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

### 4.7. Gợi ý bổ sung để hỗ trợ test

Có thể thêm một trong hai hướng sau:

- `confirmedByTestBypass`: boolean
- hoặc chỉ cần lưu trong `BookingStatusHistory.reason` / `note` rằng booking được confirm bằng luồng test

Khuyến nghị:

- chưa cần thêm field nếu chỉ phục vụ giai đoạn ngắn
- ưu tiên ghi rõ trong history để tránh làm domain phình sớm

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

Lưu ý:

- vì chưa có auto-cancel, cần có cách chủ động hủy hoặc dọn các booking `PENDING` test không còn dùng nữa để tránh giữ lịch quá lâu

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

## 8. Xác nhận booking phục vụ test khi chưa có payment thật

### 8.1. Rule

Mỗi booking mới tạo ở trạng thái `PENDING`.

Trong giai đoạn hiện tại:

- chưa có auto-cancel sau 15 phút
- chưa bắt buộc phải thanh toán thật để test toàn bộ booking flow

Cần có một cách rõ ràng để chuyển booking từ `PENDING` sang `CONFIRMED` cho mục đích test.

### 8.2. Cách triển khai khuyến nghị

Khuyến nghị dùng một trong hai cách:

1. Dùng API admin transition sớm:
   - admin/staff gọi transition `PENDING -> CONFIRMED`
   - reason ghi rõ `TEST_CONFIRMATION`

2. Tạo API test/internal tạm thời:
   - ví dụ `POST /api/bookings/{id}/simulate-payment`
   - endpoint này chỉ bật ở dev/test

Khuyến nghị cho project hiện tại:

- ưu tiên cách 1 nếu đã có admin/staff flow sớm
- nếu cần test nhanh frontend customer trước, có thể làm cách 2 tạm thời rồi xóa sau

### 8.3. Yêu cầu an toàn

- không mở cơ chế bypass này cho public production flow
- phải giới hạn theo role hoặc theo môi trường
- phải ghi `BookingStatusHistory` để biết booking nào được confirm bằng test bypass

## 9. Backend API design

### 9.1. Customer APIs

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/{id}`
- `POST /api/bookings/{id}/pay-deposit`
- `POST /api/bookings/{id}/cancel`

Ghi chú giai đoạn hiện tại:

- `pay-deposit` có thể chưa implement thật ngay nếu payment do team khác phụ trách
- có thể thay tạm bằng test flow xác nhận booking

### 9.2. Admin APIs

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/{id}`
- `POST /api/admin/bookings/{id}/transition`

API tạm phục vụ test nếu cần:

- `POST /api/admin/bookings/{id}/confirm-for-test`

Khuyến nghị:

- nếu `transition` API làm sớm thì không nhất thiết cần endpoint riêng

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
  "freeCancelUntil": "2026-06-01T08:00:00"
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
- `BookingTestConfirmationService` (optional, nếu muốn tách riêng test bypass)

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
- khi payment thật được tích hợp sau này thì mới chốt rule đầy đủ cho payment validation

### 11.3. Khi xác nhận booking phục vụ test

- chỉ cho `PENDING`
- chỉ cho admin/staff hoặc chỉ bật ở dev/test
- phải ghi rõ lý do xác nhận là test bypass
- không dùng như public customer flow

### 11.4. Khi hủy booking

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
- thời hạn hủy miễn phí
- nếu trùng lịch thì báo lỗi rõ
- nếu booking được confirm bằng luồng test, nên có cách để team dev biết đây không phải payment thật

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

### Phase 2 - Test confirmation flow trước payment thật

- Tạo `depositStatus`
- Tạo cơ chế `PENDING -> CONFIRMED` phục vụ test
- Ưu tiên dùng admin transition hoặc test/internal endpoint
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
- Khi payment team xong, thay test confirm bằng flow payment thật

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
- Confirm booking bằng test bypass:
  - chỉ admin/staff hoặc dev/test flow dùng được
  - có ghi history rõ ràng
- Hủy trước deadline:
  - `depositStatus = REFUNDED`
- Hủy sau deadline:
  - `depositStatus = FORFEITED`
- User chỉ xem được booking của chính mình
- Admin xem được toàn bộ booking

### 14.2. Frontend test

- Tạo booking thành công
- Trùng lịch hiển thị lỗi rõ
- Xác nhận booking bằng flow test đổi trạng thái UI từ `PENDING` sang `CONFIRMED`
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
7. Dùng admin transition luôn cho test hay làm test endpoint tạm riêng

## 16. Đề xuất thực thi ngay

Nếu bắt đầu code ngay, thứ tự đề xuất là:

1. Thiết kế entity + enums + repository
2. Làm create booking với overlap check + pessimistic lock
3. Làm state machine + status history
4. Làm test confirmation flow `PENDING -> CONFIRMED`
5. Làm customer list booking + admin list all booking
6. Nối frontend customer trước, admin sau
7. Khi payment thật sẵn sàng, thay test flow bằng payment confirmation flow


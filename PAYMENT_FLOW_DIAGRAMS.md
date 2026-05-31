# Payment System - Visual Flow Diagrams

## Overall Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER JOURNEY                            │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │  Payment Page        │
                    │  Select Method       │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌────────────┐ ┌────────────┐ ┌────────────┐
         │  PayPal    │ │  VNPay     │ │    Cash    │
         │   Route    │ │   Route    │ │   Inline   │
         └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
               │              │              │
               ▼              ▼              ▼
        ┌────────────────────────────────────────────┐
        │         Payment Completed                  │
        │   (PAID or PENDING for Cash)              │
        └────────────────────────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────────────┐
        │     Booking Result Page                    │
        │    Status: CONFIRMED or PENDING            │
        └────────────────────────────────────────────┘
```

## PayPal Payment Flow

```
PAYPAL PAYMENT JOURNEY
═══════════════════════════════════════════════════════════════

1. User Action
   Click "Thanh toán cọc" on PaymentPage
   
2. Navigation
   /booking/:id/payment → /booking/:id/payment/paypal

3. PayPalRedirect Component (PayPalRedirect.tsx)
   
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "redirecting"                                   │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Loading Spinner]                                   │ │
   │ │ "Đang chuyển hướng..."                              │ │
   │ │ "Vui lòng chờ, bạn sẽ được chuyển đến trang        │ │
   │ │  thanh toán PayPal"                                 │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │ (User doesn't interact)
                          │ (processPayment starts)
                          ▼
   
4. Backend Call 1: Create Payment
   POST /api/payments/deposit
   {
     bookingId: 123,
     gateway: 'PAYPAL'
   }
   Response: {
     id: 456,
     status: 'PENDING',
     gatewayReference: 'paypal-ref-xxx',
     amount: 5000000,
     ...
   }
                          │
                          ▼ (Wait 2 seconds)
   
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "processing"                                    │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Loading Spinner]                                   │ │
   │ │ "Đang xử lý thanh toán..."                          │ │
   │ │ "Vui lòng không đóng trang này, đang kiểm tra       │ │
   │ │  giao dịch"                                         │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼
   
5. Backend Call 2: Capture Payment
   POST /api/payments/paypal/{id}/capture
   {
     gatewayTransactionId: 'PAYPAL-FE-' + timestamp
   }
   Response: {
     id: 456,
     status: 'PAID',  ← Changed!
     gatewayTransactionId: 'PAYPAL-FE-xxx',
     ...
   }
                          │
                          ▼
   
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "success"                                       │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Success Icon] ✓                                    │ │
   │ │ "Thanh toán thành công!"                            │ │
   │ │ "Giao dịch của bạn đã được xác nhận. Đang          │ │
   │ │  chuyển hướng..."                                   │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼ (Wait 1.5 seconds)
   
6. Auto Redirect to Result Page
   /booking/:id/result
   
   Backend Auto-Updated:
   - Payment.status = PAID
   - Booking.status = CONFIRMED (state machine triggered)
   - Booking.depositStatus = PAID

ERROR SCENARIO
══════════════════════════════════════════════════════════════

   ┌─────────────────────────────────────────────────────────┐
   │ Status: "error"                                         │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Error Icon] ✗                                      │ │
   │ │ "Thanh toán thất bại"                               │ │
   │ │ "[User-friendly error message in Vietnamese]"       │ │
   │ │ [Button: "Quay lại thanh toán"]                     │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼ (User clicks retry button)
   
   → Navigate back to /booking/:id/payment
   → User can select PayPal again and retry
   → Same flow repeats
```

## VNPay QR Code Payment Flow

```
VNPAY QR PAYMENT JOURNEY
═══════════════════════════════════════════════════════════════

1. User Action
   Click "Thanh toán cọc" on PaymentPage

2. Navigation
   /booking/:id/payment → /booking/:id/payment/vnpay

3. VNPayQR Component (VNPayQR.tsx)
   
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "loading"                                       │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Loading Spinner]                                   │ │
   │ │ "Đang tạo mã QR..."                                 │ │
   │ │ "Vui lòng chờ một lát"                              │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼
   
4. Backend Call 1: Create Payment
   POST /api/payments/deposit
   {
     bookingId: 123,
     gateway: 'VNPAY'
   }
   Response: {
     id: 789,
     status: 'PENDING',
     gatewayReference: 'vnpay-ref-yyy',
     amount: 5000000,
     ...
   }
                          │
                          ▼
   
5. Generate QR Code
   qrCode = generateVNPayQRCode(5000000, 'BOOKING001')
   Returns: data:image/png;base64,iVBORw0KGgo...
   
   Display QR:
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "qr_display"                                    │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │   "VNPay"                                           │ │
   │ │   "Quét mã QR để thanh toán"                        │ │
   │ │                                                     │ │
   │ │   ┌─────────────────────────────┐                   │ │
   │ │   │  ███ ███ ███ ███ ███ ███   │  QR Code         │ │
   │ │   │  ███ ███ ███ ███ ███ ███   │  (Canvas)        │ │
   │ │   │  ███ ███ ███ ███ ███ ███   │  250x250px       │ │
   │ │   │  ███ ███ ███ ███ ███ ███   │                   │ │
   │ │   │  ███ ███ ███ ███ ███ ███   │                   │ │
   │ │   └─────────────────────────────┘                   │ │
   │ │                                                     │ │
   │ │   "Dùng ứng dụng ngân hàng hoặc VNPay để quét"     │ │
   │ │   "Số tiền: 5,000,000 VND"                         │ │
   │ │   "Booking: BOOKING001"                            │ │
   │ │                                                     │ │
   │ │   "Thanh toán sẽ được xác nhận trong 3s..."        │ │
   │ │   [Button: "Xác nhận thanh toán"]                  │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
              [Wait 3s]    [Manual Click]
                    │           │
                    ▼           ▼
   
6. Auto-Confirm (After 3 seconds) OR Manual Confirm
   Countdown updates: 3 → 2 → 1 → 0 → Simulate
   (Or user clicks "Xác nhận thanh toán")
   
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "processing"                                    │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Loading Spinner]                                   │ │
   │ │ "Đang xử lý thanh toán..."                          │ │
   │ │ "Vui lòng chờ, đang xác nhận giao dịch VNPay"      │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼ (Wait 1.5 seconds)
   
7. Backend Call 2: Complete VNPay Callback
   GET /api/payments/vnpay/callback
   ?reference=vnpay-ref-yyy
   &vnp_ResponseCode=00
   &vnp_TransactionNo=VNPAY-FE-zzz
   
   Response: {
     id: 789,
     status: 'PAID',  ← Changed!
     gatewayTransactionId: 'VNPAY-FE-zzz',
     ...
   }
                          │
                          ▼
   
   ┌─────────────────────────────────────────────────────────┐
   │ Status: "success"                                       │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ [Success Icon] ✓                                    │ │
   │ │ "Thanh toán thành công!"                            │ │
   │ │ "Giao dịch của bạn đã được xác nhận. Đang          │ │
   │ │  chuyển hướng..."                                   │ │
   │ └─────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼ (Wait 1.5 seconds)
   
8. Auto Redirect to Result Page
   /booking/:id/result
   
   Backend Auto-Updated:
   - Payment.status = PAID
   - Booking.status = CONFIRMED
   - Booking.depositStatus = PAID

MANUAL CONFIRMATION SCENARIO
══════════════════════════════════════════════════════════════

User clicks "Xác nhận thanh toán" before countdown reaches 0
→ Immediate call to VNPay callback
→ Status changes to "processing"
→ Then "success"
→ Then redirect
(Same result as auto-confirm)
```

## Cash Payment Flow

```
CASH PAYMENT JOURNEY
═══════════════════════════════════════════════════════════════

1. User Action
   Click "Ghi nhận thanh toán tiền mặt" on PaymentPage

2. Backend Call: Create Payment
   POST /api/payments/deposit
   {
     bookingId: 123,
     gateway: 'CASH'
   }
   Response: {
     id: 999,
     status: 'PENDING',  ← PENDING for cash!
     gateway: 'CASH',
     amount: 5000000,
     ...
   }
                          │
                          ▼
   
3. Show Success Toast
   ┌─────────────────────────────┐
   │ ✓ Đã ghi nhận thanh toán    │
   │   tiền mặt, vui lòng chờ    │
   │   staff xác nhận             │
   └─────────────────────────────┘
                          │
                          ▼
   
4. Stay on Payment Page
   Payment history shows:
   ┌─────────────────────────────────────────────────────────┐
   │ Lịch sử thanh toán                                      │
   │                                                         │
   │ CASH #999                    5,000,000 VND              │
   │ [Timestamp]               [Status: Chờ thanh toán] 🟡   │
   └─────────────────────────────────────────────────────────┘
                          │
                          ▼
   
5. Admin Confirms Payment (Later)
   Admin Portal:
   POST /api/admin/payments/bookings/123/confirm-cash
   
   Response: {
     id: 999,
     status: 'PAID',  ← Changed by Admin!
     ...
   }
                          │
                          ▼
   
6. Frontend Detects Change
   When customer refreshes or re-visits payment page:
   - Payment status updates to "PAID"
   - Booking status updates to "CONFIRMED"
   - Can now proceed to result page
```

## Error Handling Flow

```
ERROR DETECTION & RECOVERY
═══════════════════════════════════════════════════════════════

Any Error Occurs
       │
       ▼
Error caught in try-catch
       │
       ▼
parsePaymentError(error)
       │
       ├─→ Network Error
       │   userMessage: "Lỗi kết nối. Vui lòng kiểm tra internet..."
       │   recoverable: true
       │
       ├─→ Timeout Error
       │   userMessage: "Yêu cầu hết thời gian chờ. Vui lòng thử lại."
       │   recoverable: true
       │
       ├─→ Validation Error (400)
       │   userMessage: "[Specific validation error]"
       │   recoverable: true
       │
       ├─→ Auth Error (401)
       │   userMessage: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại."
       │   recoverable: false
       │
       ├─→ Permission Error (403)
       │   userMessage: "Bạn không có quyền thực hiện hành động này."
       │   recoverable: false
       │
       ├─→ Not Found Error (404)
       │   userMessage: "Booking không tồn tại. Vui lòng kiểm tra lại."
       │   recoverable: false
       │
       ├─→ Conflict Error (409)
       │   userMessage: "Booking này đã được xử lý. Vui lòng quay lại..."
       │   recoverable: false
       │
       ├─→ Server Error (500+)
       │   userMessage: "Lỗi máy chủ. Vui lòng thử lại sau."
       │   recoverable: true
       │
       └─→ Unknown Error
           userMessage: "Đã xảy ra lỗi không xác định. Vui lòng thử lại."
           recoverable: true
       │
       ▼
Show Error State
┌─────────────────────────────────────────────────────────┐
│ Status: "error"                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Error Icon] ✗                                      │ │
│ │ "Thanh toán thất bại"                               │ │
│ │ "[User-friendly error message]"                     │ │
│ │ [Button: "Quay lại thanh toán"]                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
       │
       ▼
User Decision
       │
       ├─→ Click "Quay lại thanh toán"
       │   Navigate to /booking/:id/payment
       │   User can retry or select different method
       │
       └─→ (If recoverable=false)
           Error is terminal, no retry option shown
```

## State Transition Diagram

```
PAYMENT STATE MACHINE
═══════════════════════════════════════════════════════════════

Frontend Component States:
┌─────────────┐
│   loading   │  (Initial page load)
└──────┬──────┘
       │
       ├─ PayPal ──→ ┌──────────────┐
       │             │ redirecting  │ → processing → success → redirect
       │             └──────────────┘ → error (with retry)
       │
       ├─ VNPay ──→  ┌──────────────┐
       │             │ qr_display   │ → processing → success → redirect
       │             │ (countdown)  │ → error (with retry)
       │             └──────────────┘
       │
       └─ Cash ──→   (Inline, no state change)
                    Show toast, stay on page

Backend Payment States:
┌─────────┐
│ PENDING │  (Initial creation)
└────┬────┘
     │
     ├─→ PAID (Gateway captured payment)
     │   ↓
     │   (Booking state machine triggered)
     │   Booking: PENDING → CONFIRMED
     │
     ├─→ FAILED (Gateway rejected payment)
     │
     ├─→ EXPIRED (Payment time limit exceeded)
     │
     └─→ REFUNDED (Admin refunded payment)
         ↓
         Booking can transition to CANCELLED
```

## Component Dependency Tree

```
App.tsx
├── PaymentPage (index.tsx)
│   ├── Uses: bookingApi, paymentApi
│   ├── Shows: Payment method selection
│   └── Navigates to: PayPalRedirect or VNPayQR
│
├── PayPalRedirect.tsx
│   ├── Uses: paymentApi, bookingApi, paymentErrorHandler
│   ├── Uses: qrCodeGenerator (not applicable, included for completeness)
│   ├── Shows: PayPal simulation
│   └── Navigates to: PaymentResultPage
│
└── VNPayQR.tsx
    ├── Uses: paymentApi, bookingApi, qrCodeGenerator, paymentErrorHandler
    ├── Shows: QR code display
    └── Navigates to: PaymentResultPage

Utility Dependencies:
├── qrCodeGenerator.ts
│   ├── generateFakeQRCode() → Canvas API
│   └── generateVNPayQRCode() → Uses generateFakeQRCode()
│
└── paymentErrorHandler.ts
    ├── parsePaymentError() → Analyzes error object
    ├── extractErrorMessage() → Extracts message from response
    └── safePaymentCall() → Wrapper for API calls
```

---

## Key Performance Metrics

```
TIMING ANALYSIS (Approximate)
═══════════════════════════════════════════════════════════════

PayPal Flow Total Time: ~4-5 seconds
├─ Page load: ~500ms
├─ Create payment API: ~500ms
├─ Processing simulation: 2000ms
├─ Capture payment API: ~500ms
├─ Redirect animation: ~1500ms
└─ Result page load: ~500ms

VNPay Flow Total Time: ~4-5 seconds
├─ Page load: ~500ms
├─ Create payment API: ~500ms
├─ QR code generation: ~20ms
├─ User wait (countdown): 3000ms
├─ QR callback API: ~500ms
├─ Processing simulation: 1500ms
├─ Redirect animation: ~500ms
└─ Result page load: ~500ms

Cash Flow Total Time: <1 second
├─ Page load: ~500ms
├─ Create payment API: ~300ms
└─ Toast display: ~3000ms

QR Code Generation: ~10-20ms
Error Parsing: <1ms
State Updates: <1ms
```

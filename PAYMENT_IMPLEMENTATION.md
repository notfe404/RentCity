# Payment Flow Implementation - RentCity

## Overview

The RentCity payment system now supports three payment methods with a smooth, integrated UX:

1. **PayPal** - Simulated PayPal checkout with automatic completion
2. **VNPay** - QR code-based payment with simulated scanning
3. **Cash** - In-store payment with staff confirmation

## Architecture

### User Flow

```
PaymentPage (Method Selection)
  ↓
  ├─ PayPal → PayPalRedirect → PayPal Processing → Payment Result
  ├─ VNPay → VNPayQR → QR Display → Payment Simulation → Payment Result
  └─ Cash → Inline Processing → Staff Confirmation Pending → Payment Result
```

### Component Structure

```
frontend/src/pages/PaymentPage/
├── index.tsx              (Main payment method selection)
├── PayPalRedirect.tsx     (PayPal checkout simulation)
└── VNPayQR.tsx            (VNPay QR code display)

frontend/src/utils/
├── qrCodeGenerator.ts     (Fake QR code generation)
└── paymentErrorHandler.ts (Graceful error handling)
```

## Features

### 1. PayPal Payment Flow

**File**: `PayPalRedirect.tsx`

- Simulates PayPal checkout experience
- Shows PayPal branding and UI
- 2-second processing simulation
- Automatic payment completion
- Error recovery with retry option

**Process**:
1. User clicks "Thanh toán cọc" on PaymentPage
2. Redirected to `/booking/:id/payment/paypal`
3. Fake QR payment created via backend
4. Simulates 2-second processing delay
5. Captures payment with transaction ID
6. Redirects to payment result page

### 2. VNPay QR Code Payment Flow

**File**: `VNPayQR.tsx`

- Generates pseudo-random QR code
- 3-second auto-confirmation countdown
- Manual confirmation option
- Simulates payment processing
- Mobile-friendly interface

**Process**:
1. User clicks "Thanh toán cọc" on PaymentPage
2. Redirected to `/booking/:id/payment/vnpay`
3. VNPay QR code generated
4. Displays "Quét mã QR để thanh toán"
5. Auto-confirms after 3 seconds (simulating QR scan)
6. User can manually confirm if needed
7. Completes VNPay mock callback
8. Redirects to payment result page

**QR Code Generation**: `qrCodeGenerator.ts`
- Generates fake QR codes using Canvas API
- Creates realistic 25x25 module QR patterns
- Includes position detection markers
- Hash-based pseudo-random content

### 3. Cash Payment Flow

**File**: `PaymentPage/index.tsx`

- Simple inline processing
- Shows "Đã ghi nhận thanh toán tiền mặt"
- Staff confirmation required
- No additional pages needed

**Process**:
1. User selects "Tiền mặt" method
2. Clicks "Ghi nhận thanh toán tiền mặt"
3. Creates PENDING cash payment
4. Shows success toast
5. Payment waits for staff confirmation
6. Staff confirms via admin panel

## Error Handling

**File**: `paymentErrorHandler.ts`

Gracefully handles all error scenarios:

- **Network Errors**: "Lỗi kết nối. Vui lòng kiểm tra internet..."
- **Validation Errors**: Specific validation messages
- **Timeout**: "Yêu cầu hết thời gian chờ. Vui lòng thử lại."
- **Server Errors**: "Lỗi máy chủ. Vui lòng thử lại sau."
- **Authorization**: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại."
- **Not Found**: "Booking không tồn tại..."
- **Conflict**: "Booking này đã được xử lý..."

All errors show user-friendly Vietnamese messages with recovery options.

## Routes

Added to `constants/routes.ts`:
- `PAYMENT_PAYPAL`: `/booking/:id/payment/paypal`
- `PAYMENT_VNPAY`: `/booking/:id/payment/vnpay`

All routes protected with `ProtectedRoute` requiring `CUSTOMER` role.

## API Endpoints Used

**Create Payment**:
```
POST /api/payments/deposit
{
  bookingId: number,
  gateway: 'PAYPAL' | 'VNPAY' | 'CASH'
}
→ ApiPaymentResponse
```

**PayPal Capture**:
```
POST /api/payments/paypal/{id}/capture
{
  gatewayTransactionId?: string
}
→ ApiPaymentResponse
```

**VNPay Callback**:
```
GET /api/payments/vnpay/callback
?reference={reference}
&vnp_ResponseCode=00
&vnp_TransactionNo={transactionNo}
→ ApiPaymentResponse
```

## Status Transitions

### Payment Status Flow
```
PENDING → PAID → (Booking status: PENDING → CONFIRMED)
       ↘ FAILED ↗
       ↘ EXPIRED ↗
       ↘ REFUNDED ↗
```

### Booking Status Flow (after payment)
```
PENDING (await deposit) → CONFIRMED (after PAID)
```

## Testing

### PayPal Flow
1. Navigate to booking payment page
2. Select "PayPal" method
3. Click "Thanh toán cọc"
4. Observe PayPal redirect simulation
5. Wait for automatic completion
6. Check success page

### VNPay Flow
1. Navigate to booking payment page
2. Select "VNPay" method
3. Click "Thanh toán cọc"
4. View QR code display
5. Wait 3 seconds for auto-confirmation or click "Xác nhận thanh toán"
6. Observe payment processing
7. Check success page

### Cash Flow
1. Navigate to booking payment page
2. Select "Tiền mặt"
3. Click "Ghi nhận thanh toán tiền mặt"
4. See success notification
5. Payment pending staff confirmation

## Browser Compatibility

- ✅ Chrome/Edge (Canvas QR generation)
- ✅ Firefox (Canvas QR generation)
- ✅ Safari (Canvas QR generation)
- ✅ Mobile browsers

## Performance Notes

- QR code generation: ~10ms via Canvas
- PayPal simulation: 2 seconds
- VNPay simulation: 3 seconds + 1.5 seconds processing
- No external dependencies (Canvas-based QR)
- Error handling includes retry loops

## Future Enhancements

1. Real PayPal SDK Integration (PayPal Commerce Platform)
2. Real VNPay Integration (form generation + signature validation)
3. Payment webhooks and notifications
4. Invoice PDF generation
5. Refund management interface
6. Payment analytics dashboard
7. Multiple language support
8. Additional payment methods (e-wallets, bank transfers)

## Security Considerations

- ✅ All routes protected (CUSTOMER role required)
- ✅ Backend validates payment ownership
- ✅ Idempotent payment creation (prevents duplicate charges)
- ✅ Pessimistic locking on concurrent payments
- ✅ Transaction ID tracking
- ✅ User ownership validation

## Debugging

Set breakpoints in:
- `PayPalRedirect.tsx` - processPayment function
- `VNPayQR.tsx` - initPayment or simulateQRScan functions
- `paymentApi.ts` - API calls
- `paymentErrorHandler.ts` - parsePaymentError for error inspection

## File Summary

| File | Purpose |
|------|---------|
| `PaymentPage/index.tsx` | Method selection & cash payment |
| `PaymentPage/PayPalRedirect.tsx` | PayPal simulation flow |
| `PaymentPage/VNPayQR.tsx` | VNPay QR code flow |
| `qrCodeGenerator.ts` | Canvas-based QR generation |
| `paymentErrorHandler.ts` | Error parsing & handling |
| `constants/routes.ts` | Route definitions |
| `App.tsx` | Route registration |

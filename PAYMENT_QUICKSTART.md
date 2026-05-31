# Payment System - Quick Start Guide

## What's New?

The payment system now features a smooth, gateway-specific flow with:

- **PayPal Simulation**: Redirects to mock PayPal checkout, auto-completes payment
- **VNPay QR Code**: Displays fake QR code, auto-confirms after 3 seconds
- **Cash Payment**: Simple inline confirmation, pending staff approval
- **Graceful Error Handling**: User-friendly Vietnamese error messages, no crashes

## How to Use

### For Customers

#### PayPal Payment
1. Go to booking and click "Thanh toán cọc"
2. Select "PayPal" method
3. Click "Thanh toán cọc"
4. You'll see a PayPal checkout simulation screen
5. Payment auto-completes in 2 seconds
6. You're redirected to booking confirmation

#### VNPay Payment
1. Go to booking and click "Thanh toán cọc"
2. Select "VNPay" method
3. Click "Thanh toán cọc"
4. A QR code appears with "Quét mã QR để thanh toán"
5. Payment auto-confirms in 3 seconds (simulating QR scan)
6. Or click "Xác nhận thanh toán" to confirm manually
7. You're redirected to booking confirmation

#### Cash Payment
1. Go to booking and click "Thanh toán cọc"
2. Select "Tiền mặt"
3. Click "Ghi nhận thanh toán tiền mặt"
4. System shows "Đã ghi nhận thanh toán tiền mặt, vui lòng chờ staff xác nhận"
5. Payment remains PENDING until staff confirms in admin panel

### For Developers

#### File Structure
```
frontend/src/
├── pages/PaymentPage/
│   ├── index.tsx              # Payment method selection
│   ├── PayPalRedirect.tsx     # PayPal flow
│   └── VNPayQR.tsx            # VNPay QR flow
│
├── utils/
│   ├── qrCodeGenerator.ts     # QR code generation
│   └── paymentErrorHandler.ts # Error handling
│
├── constants/
│   └── routes.ts              # Updated with new routes
│
└── App.tsx                    # Updated with new routes
```

#### Routes
```
/booking/:id/payment              - Method selection
/booking/:id/payment/paypal       - PayPal redirect
/booking/:id/payment/vnpay        - VNPay QR display
/booking/:id/result               - Payment result
```

#### Environment Setup
```bash
# No additional packages needed
# Uses built-in Canvas API for QR generation
# Uses existing API services
```

#### Testing the Flow

**PayPal Flow**:
```bash
1. Navigate to http://localhost:5173/booking/[booking-id]/payment
2. Select "PayPal"
3. Click "Thanh toán cọc"
4. Wait for auto-completion (2 seconds)
5. Check Payment status → should be PAID
6. Check Booking status → should be CONFIRMED
```

**VNPay Flow**:
```bash
1. Navigate to http://localhost:5173/booking/[booking-id]/payment
2. Select "VNPay"
3. Click "Thanh toán cọc"
4. View QR code
5. Wait for auto-confirmation (3 seconds) or click button
6. Check Payment status → should be PAID
7. Check Booking status → should be CONFIRMED
```

**Cash Flow**:
```bash
1. Navigate to http://localhost:5173/booking/[booking-id]/payment
2. Select "Tiền mặt"
3. Click "Ghi nhận thanh toán tiền mặt"
4. See success message
5. Check Payment status → should be PENDING
6. As admin: POST /api/admin/payments/bookings/{id}/confirm-cash
7. Check Payment status → should be PAID
8. Check Booking status → should be CONFIRMED
```

## API Testing with REST Client

**Use the file**: `api-tests/module-payment.http`

```bash
# Test VNPay flow
1. Login as customer
2. Create booking
3. Create VNPay payment
4. Run VNPay callback
5. Check booking status

# Test PayPal flow (from frontend)
1. Same as VNPay but select PAYPAL in step 2
2. Frontend handles capture automatically

# Test Cash flow
1. Create booking
2. Create CASH payment
3. As admin: confirm-cash endpoint
4. Check booking status
```

## Error Handling

The system gracefully handles:

- **Network errors**: "Lỗi kết nối. Vui lòng kiểm tra internet..."
- **Timeout**: "Yêu cầu hết thời gian chờ. Vui lòng thử lại."
- **Invalid booking**: "Booking không tồn tại..."
- **Already paid**: "Booking này đã được xử lý..."
- **Server error**: "Lỗi máy chủ. Vui lòng thử lại sau."

All errors show user-friendly messages and provide recovery options.

## Key Features

✅ **No External Dependencies**: QR code generation uses Canvas API
✅ **Fast Payment Flow**: PayPal (2s), VNPay (3s), Cash (inline)
✅ **Mobile Responsive**: All pages work on mobile devices
✅ **Error Recovery**: Retry buttons on all error screens
✅ **Vietnamese UI**: All text in Vietnamese
✅ **Security**: Route protection, user validation, transaction tracking
✅ **Idempotent Payments**: No duplicate charges
✅ **State Management**: Proper loading, processing, success, error states

## Customization

### Change PayPal Processing Time
In `PayPalRedirect.tsx`:
```typescript
// Change from 2000ms to your desired time
await new Promise((resolve) => setTimeout(resolve, 2000));
```

### Change VNPay Auto-Confirmation Time
In `VNPayQR.tsx`:
```typescript
// Change from 3000ms to your desired time
setTimeout(() => {
  simulateQRScan(createdPayment.gatewayReference);
}, 3000);
```

### Modify QR Code Size
In `VNPayQR.tsx`:
```typescript
// Change from 250 to desired size
const qr = generateVNPayQRCode(booking.depositAmount, booking.bookingCode);
// Then update img width in render
```

### Customize Error Messages
In `paymentErrorHandler.ts`:
```typescript
// Add custom error handling in parsePaymentError()
// Modify userMessage property for each error type
```

## Production Deployment

### Before Going Live

1. **Replace Mock with Real PayPal SDK**
   - Install: `npm install @paypal/checkout-server-sdk`
   - Update `PayPalRedirect.tsx` to use real API

2. **Replace Mock with Real VNPay Integration**
   - Get VNPay credentials
   - Implement actual QR generation via VNPay API
   - Validate signatures on callback

3. **Enable Invoice PDF Generation**
   - The endpoint `/api/invoices/:bookingId/pdf` is ready
   - Just needs implementation on backend

4. **Set Up Payment Webhooks**
   - Configure PayPal webhooks
   - Configure VNPay webhooks
   - Verify signatures

5. **Add Payment Notifications**
   - Send email after successful payment
   - Send SMS for cash payment reminders
   - Send refund notifications

## Troubleshooting

### Payment stuck on "Đang xử lý..."
- Check browser console for errors
- Verify backend is running
- Check network tab for failed requests
- Reload and try again

### QR code not showing
- Verify browser supports Canvas API
- Check console for "Canvas error"
- Ensure JavaScript is enabled

### Booking not confirming after payment
- Check booking status in admin panel
- Verify payment status is PAID
- Check backend logs for transaction errors
- Manually transition booking if needed

### Staff confirmation not working
- Verify user is ADMIN or STAFF
- Check booking ID is correct
- Verify payment is PENDING
- Check backend logs

## Support

For issues:
1. Check `PAYMENT_IMPLEMENTATION.md` for detailed docs
2. Review error messages in console
3. Check API tests in `api-tests/module-payment.http`
4. Review backend logs for transaction details

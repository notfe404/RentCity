# Payment History Feature - Testing Guide

## 📋 Pre-Testing Checklist

### Environment Setup:
- [ ] Frontend running on localhost:5173
- [ ] Backend API running on localhost:8080
- [ ] Database populated with test data
- [ ] User logged in as CUSTOMER role
- [ ] At least one completed booking exists

### Browser Setup:
- [ ] Clear browser cache
- [ ] Clear local storage
- [ ] Open DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Network tab ready to monitor API calls

---

## 🧪 Functional Testing

### Test 1: Navigate to Payment History

**Steps:**
1. Login as customer
2. Click "Lịch sử thanh toán" in sidebar
3. Wait for page to load

**Expected Results:**
- [ ] Page navigates to `/payments`
- [ ] Summary cards display
- [ ] Transaction list loads
- [ ] No console errors
- [ ] Page title shows "Lịch sử thanh toán"

**Network Calls:**
- [ ] GET `/api/payments/me` returns 200
- [ ] Response contains payment array
- [ ] Response includes payment details

---

### Test 2: View Summary Cards

**Initial State:**
- Open payments page with no filters

**Expected Display:**
- [ ] Card 1: "Tổng Thanh Toán" with total amount in ₫
- [ ] Card 2: "Tổng Giao Dịch" with transaction count
- [ ] Card 3: "Đang Chờ" with pending count
- [ ] All values are numbers or "-"
- [ ] Cards are properly styled with green accent

**Card Data Validation:**
- [ ] Total paid = sum of all PAID transactions
- [ ] Transaction count = all transactions count
- [ ] Pending count = count of PENDING status

---

### Test 3: Payment List Display

**Expected Layout:**
- [ ] Payment list shows all transactions
- [ ] Each row shows:
  - [ ] Gateway icon (PayPal/VNPay/Cash)
  - [ ] Status badge with color
  - [ ] Booking code
  - [ ] Payment type (DEPOSIT/FULL/EXTRA_CHARGE/REFUND)
  - [ ] Amount in ₫
  - [ ] Timestamp
  - [ ] "Chi tiết" button

**Data Validation:**
- [ ] Amounts are formatted correctly with commas
- [ ] Dates are in Vietnamese format
- [ ] Status colors match expected colors
- [ ] All bookings have codes
- [ ] No missing data fields

**Sorting:**
- [ ] Transactions appear in reverse chronological order
- [ ] Latest payment appears first
- [ ] Oldest payment appears last

---

### Test 4: Filter by Status

**Setup:** Open payments page with multiple transactions

**Test PENDING Filter:**
1. Click status filter or select "PENDING"
2. Observe list updates

**Expected Results:**
- [ ] List shows only PENDING transactions
- [ ] Summary cards update
- [ ] "Tổng Giao Dịch" shows only PENDING count
- [ ] Transaction count matches pending transactions
- [ ] No PAID/FAILED/REFUNDED transactions visible

**Test All Other Statuses:**
1. Repeat for PAID, FAILED, REFUNDED, EXPIRED
2. Verify filtering works for each

**Expected Results:**
- [ ] Each status filter shows correct transactions
- [ ] Summary updates accordingly
- [ ] Count matches filtered results
- [ ] All filters can be tested

---

### Test 5: Filter by Gateway

**Setup:** Open payments page with mixed gateways

**Test PayPal Filter:**
1. Select gateway filter: PayPal
2. Observe list updates

**Expected Results:**
- [ ] Only PayPal transactions display
- [ ] PayPal icon visible on all rows
- [ ] VNPay and Cash transactions hidden
- [ ] Count in summary updates

**Test VNPay Filter:**
1. Select gateway filter: VNPay
2. Verify results

**Expected Results:**
- [ ] Only VNPay transactions display
- [ ] VNPay icon visible
- [ ] Other gateways hidden

**Test Cash Filter:**
1. Select gateway filter: Cash
2. Verify results

**Expected Results:**
- [ ] Only cash transactions display
- [ ] Cash icon visible
- [ ] Other gateways hidden

---

### Test 6: Search Functionality

**Setup:** Know exact booking codes in system

**Test Search by Booking Code:**
1. Enter booking code in search box (e.g., "BOOKING001")
2. Press Enter or wait for auto-filter

**Expected Results:**
- [ ] Only transactions with matching code display
- [ ] Results update in real-time
- [ ] Partial match works (e.g., "BOOK" finds "BOOKING001")
- [ ] No results show friendly message

**Test Search by Payment ID:**
1. Enter payment ID number
2. Verify results

**Expected Results:**
- [ ] Only transactions with matching ID display
- [ ] Exact match required for ID
- [ ] Correct transaction shows

**Test Invalid Search:**
1. Enter non-existent booking code
2. Press Enter

**Expected Results:**
- [ ] Empty list displays
- [ ] "Chưa có giao dịch" message appears
- [ ] No errors in console

---

### Test 7: Date Range Filter

**Setup:** Open payments page

**Test Date Range:**
1. Select start date (earlier)
2. Select end date (later)
3. Apply filter

**Expected Results:**
- [ ] Only transactions within date range display
- [ ] Boundaries are inclusive (start/end dates included)
- [ ] Summary updates with filtered count
- [ ] Correct transactions appear

**Test Start Date Only:**
1. Set start date only
2. Leave end date blank

**Expected Results:**
- [ ] All transactions from start date forward
- [ ] No end date required
- [ ] Filter applies correctly

**Test End Date Only:**
1. Clear start date
2. Set end date only

**Expected Results:**
- [ ] All transactions up to end date
- [ ] No start date required
- [ ] Filter applies correctly

**Test Invalid Date Range:**
1. Set start date after end date
2. Observe behavior

**Expected Results:**
- [ ] Either no results or warning message
- [ ] Graceful handling (no crash)
- [ ] User can correct dates

---

### Test 8: Combine Multiple Filters

**Setup:** Open payments page

**Test 1: Status + Gateway**
1. Filter: Status = PAID, Gateway = VNPay
2. Verify results

**Expected Results:**
- [ ] Only PAID VNPay transactions
- [ ] Summary shows combined filter results
- [ ] Both filters active simultaneously

**Test 2: Status + Date Range**
1. Filter: Status = PENDING, Date = Last 7 days
2. Verify results

**Expected Results:**
- [ ] Only PENDING transactions from last 7 days
- [ ] Other statuses excluded
- [ ] Date range applied

**Test 3: All Filters Combined**
1. Status = PAID
2. Gateway = PayPal
3. Date Range = Last 30 days
4. Search = specific booking code

**Expected Results:**
- [ ] Only PayPal PAID payments from last 30 days with booking code
- [ ] Multiple filters work together
- [ ] Summary reflects all filters

---

### Test 9: Reset Filters

**Setup:** Apply multiple filters

**Steps:**
1. Apply various filters (status, gateway, date)
2. Click "Reset" or "Clear Filters" button

**Expected Results:**
- [ ] All filters clear
- [ ] List returns to showing all transactions
- [ ] Summary cards show totals for all payments
- [ ] Search box empties
- [ ] Date pickers reset

---

### Test 10: View Payment Details

**Setup:** Open payments page with transactions

**Steps:**
1. Click "Chi tiết" button on any transaction
2. Modal opens showing details

**Expected Modal Content:**
- [ ] Transaction ID displays
- [ ] Payment status shows
- [ ] Full amount visible
- [ ] Currency displayed (VND)
- [ ] Payment type shown
- [ ] Gateway information displays
- [ ] Created date/time shows
- [ ] Paid date/time shows (if applicable)
- [ ] Refunded date/time shows (if applicable)
- [ ] Gateway reference ID visible
- [ ] Booking code reference shown

**Expected Behavior:**
- [ ] Modal overlays page
- [ ] Close button (X) works
- [ ] Can click outside to close
- [ ] ESC key closes modal
- [ ] No scrolling behind modal

---

### Test 11: Download Invoice from Modal

**Setup:** Open payment details modal for PAID transaction

**Steps:**
1. Look for invoice download button
2. Click "Tải hóa đơn" or similar button
3. Wait for download

**Expected Results:**
- [ ] PDF file downloads
- [ ] File name includes booking ID
- [ ] File size > 0 KB
- [ ] PDF opens in reader
- [ ] Invoice contains:
  - [ ] Customer name
  - [ ] Booking details
  - [ ] Vehicle information
  - [ ] Amount paid
  - [ ] Payment date
  - [ ] Invoice number

**Browser Download Behavior:**
- [ ] Download appears in browser
- [ ] File downloads to Downloads folder
- [ ] No errors in console
- [ ] Toast notification confirms download

---

### Test 12: Download Unavailable for Other Statuses

**Setup:** Open payment details for non-PAID transaction

**Expected Results:**
- [ ] Download button is disabled or hidden
- [ ] Tooltip explains "Only PAID transactions"
- [ ] No download functionality available

---

### Test 13: Empty State (No Payments)

**Setup:** Login as new customer with no payments

**Expected Results:**
- [ ] Summary cards show "No data" or "0"
- [ ] List shows friendly message
- [ ] CreditCard icon in empty state
- [ ] Message: "Chưa có giao dịch"
- [ ] Suggested action (make a booking)

---

### Test 14: Profile Page Tab System

**Setup:** Open Profile page

**Steps:**
1. Click "Giao dịch" tab
2. Verify Transactions tab loads
3. Click "Hồ sơ" tab
4. Verify Profile content loads

**Expected Results (Profile Tab):**
- [ ] Personal information displays
- [ ] Edit button visible
- [ ] Address section shows
- [ ] ID documents section shows
- [ ] Tab button highlighted in green

**Expected Results (Transactions Tab):**
- [ ] Summary mini cards show
- [ ] Status filter buttons visible
- [ ] Recent 5 transactions list
- [ ] "Xem tất cả" link to full payments page
- [ ] Tab button highlighted in green

**Tab Switching:**
- [ ] Switching tabs is smooth
- [ ] No data loss when switching
- [ ] Content updates correctly

---

### Test 15: Navigation Links

**Setup:** Open various pages

**Test 1: Sidebar Link**
1. In sidebar, click "Lịch sử thanh toán"
2. Verify navigation to `/payments`

**Expected Results:**
- [ ] URL changes to `/payments`
- [ ] Page loads correctly

**Test 2: Profile Tab Link**
1. In ProfilePage, click Transactions tab
2. Then click "Xem tất cả" link
3. Verify navigation to `/payments`

**Expected Results:**
- [ ] Navigates to full payments page
- [ ] All features work

**Test 3: Direct URL Navigation**
1. Type `/payments` in address bar
2. Press Enter

**Expected Results:**
- [ ] Page loads directly
- [ ] All content displays
- [ ] No 404 or routing errors

---

## 🎨 UI/UX Testing

### Test 16: Responsive Design - Desktop

**Viewport:** 1920 x 1080 (Desktop)

**Expected Layout:**
- [ ] Full width properly utilized
- [ ] Summary cards in row
- [ ] Filters easy to access
- [ ] Transaction list shows all columns
- [ ] No horizontal scrolling
- [ ] Typography clear and readable
- [ ] Buttons properly sized

---

### Test 17: Responsive Design - Tablet

**Viewport:** 768 x 1024 (iPad)

**Expected Layout:**
- [ ] Summary cards stack nicely
- [ ] Filters remain accessible
- [ ] Transaction list adapts
- [ ] Font sizes readable
- [ ] Buttons easily tappable (>44px)
- [ ] No overflow or cutoff

---

### Test 18: Responsive Design - Mobile

**Viewport:** 375 x 667 (iPhone SE)

**Expected Layout:**
- [ ] Page scrolls vertically
- [ ] Summary cards stack
- [ ] Filters collapse if needed
- [ ] Transaction list shows essential info
- [ ] Details expandable
- [ ] All buttons tappable
- [ ] No horizontal scroll

---

### Test 19: Color Scheme Consistency

**Expected Colors:**
- [ ] Primary green: `#78ad44` for active tab
- [ ] Status colors match:
  - [ ] PENDING: Orange
  - [ ] PAID: Green
  - [ ] FAILED: Red
  - [ ] REFUNDED: Blue
  - [ ] EXPIRED: Gray
- [ ] Text colors contrast properly
- [ ] Icons visible on backgrounds

---

### Test 20: Theme Consistency

**Expected Styling:**
- [ ] Rounded corners match design (rounded-2xl, rounded-3xl)
- [ ] Shadows consistent (shadow-sm, shadow-md)
- [ ] Spacing consistent (gap-4, p-6, etc.)
- [ ] Border colors match (border-gray-100)
- [ ] Typography hierarchy clear

---

## 🔒 Security Testing

### Test 21: Authentication Required

**Steps:**
1. Logout from account
2. Try to access `/payments` directly
3. Observe behavior

**Expected Results:**
- [ ] Redirected to login page
- [ ] Cannot access payment data
- [ ] No payment info visible

---

### Test 22: Authorization Check

**Setup:** Login as non-CUSTOMER role

**Steps:**
1. Try to access `/payments`
2. Observe response

**Expected Results:**
- [ ] Access denied
- [ ] Redirected to appropriate page
- [ ] No payment data accessible

---

### Test 23: Data Privacy

**Setup:** Two customer accounts with different payments

**Steps:**
1. Login as Customer A
2. View payments
3. Logout and login as Customer B
4. View payments

**Expected Results:**
- [ ] Customer A sees only their payments
- [ ] Customer B sees only their payments
- [ ] No cross-account data leakage
- [ ] Each account isolated

---

## ⚡ Performance Testing

### Test 24: Initial Load Time

**Measurement:**
1. Open DevTools > Network
2. Navigate to `/payments`
3. Measure time to fully loaded

**Expected Results:**
- [ ] Page DOMContentLoaded < 1.5s
- [ ] Page fully loaded < 3s
- [ ] API response < 1s
- [ ] No UI blocking
- [ ] Loading state visible during fetch

---

### Test 25: Filtering Performance

**Measurement:**
1. With 100+ transactions loaded
2. Apply multiple filters
3. Measure response time

**Expected Results:**
- [ ] Filters apply instantly (< 100ms)
- [ ] No UI lag or jank
- [ ] Smooth animation
- [ ] No browser freezing

---

### Test 26: Modal Performance

**Measurement:**
1. With many transactions displayed
2. Open details modal multiple times
3. Measure open/close speed

**Expected Results:**
- [ ] Modal opens quickly (< 200ms)
- [ ] Modal closes smoothly
- [ ] No lag when opening
- [ ] Animation smooth

---

### Test 27: PDF Download Performance

**Measurement:**
1. Download multiple invoices
2. Time each download
3. Check file integrity

**Expected Results:**
- [ ] Each PDF generates in < 5s
- [ ] File size reasonable (< 500KB)
- [ ] PDFs are viewable
- [ ] No download errors

---

## 🐛 Error Handling

### Test 28: Network Error Recovery

**Setup:** Open payments page

**Steps:**
1. Open DevTools Network tab
2. Set throttling to "Offline"
3. Try to load payments
4. Go back online
5. Retry

**Expected Results:**
- [ ] Error message appears
- [ ] "Lỗi tải dữ liệu" message shows
- [ ] Retry button available
- [ ] Reconnection works
- [ ] Data loads after retry

---

### Test 29: Invalid Date Range

**Steps:**
1. Set start date after end date
2. Apply filter

**Expected Results:**
- [ ] Graceful error handling
- [ ] Warning message appears
- [ ] No crash or error
- [ ] User can correct dates

---

### Test 30: Missing Invoice

**Steps:**
1. Try to download invoice for transaction without booking
2. Observe behavior

**Expected Results:**
- [ ] Error message appears
- [ ] Toast notification: "Không thể tải hóa đơn"
- [ ] Download button disabled
- [ ] No crash

---

## 📊 Data Validation

### Test 31: Amount Formatting

**Expected Format:**
- [ ] All amounts show as numbers with commas
- [ ] Currency symbol (₫) present
- [ ] No decimal places (whole numbers)
- [ ] Negative amounts for refunds shown properly

**Test Cases:**
- [ ] 1,000 displays as "1,000 ₫"
- [ ] 100,000 displays as "100,000 ₫"
- [ ] 1,000,000 displays as "1,000,000 ₫"

---

### Test 32: Date Formatting

**Expected Format:**
- [ ] Vietnamese date format
- [ ] Time included
- [ ] Consistent across all displays

**Test Cases:**
- [ ] "31/05/2026 14:30"
- [ ] All dates properly formatted

---

### Test 33: Status Display

**Validation:**
- [ ] All statuses display correct labels
- [ ] Icons match status
- [ ] Colors correct
- [ ] Text readable

**Test Cases:**
- [ ] PENDING → "Chờ xử lý" (Orange)
- [ ] PAID → "Đã thanh toán" (Green)
- [ ] FAILED → "Thất bại" (Red)
- [ ] REFUNDED → "Hoàn tiền" (Blue)
- [ ] EXPIRED → "Hết hạn" (Gray)

---

### Test 34: Gateway Display

**Validation:**
- [ ] Icons display correctly
- [ ] Gateway names show
- [ ] Badges styled properly

**Test Cases:**
- [ ] PayPal → PayPal badge
- [ ] VNPay → VNPay badge
- [ ] Cash → "Tiền mặt" label

---

## 🔄 Integration Testing

### Test 35: Integration with BookingPage

**Setup:** Complete a booking

**Steps:**
1. Complete booking process
2. Proceed to payment
3. Complete payment flow
4. Navigate to payments history
5. Find new payment

**Expected Results:**
- [ ] New payment appears in list
- [ ] Booking code matches
- [ ] Status reflects payment status
- [ ] Amount matches booking

---

### Test 36: Integration with ProfilePage

**Steps:**
1. From ProfilePage, switch to Transactions tab
2. Verify data matches full payments page
3. Click "Xem tất cả"
4. Verify navigation

**Expected Results:**
- [ ] Same data in both views
- [ ] Profile tab shows latest 5
- [ ] Full page shows all
- [ ] Navigation works

---

## ✅ Final Checklist

### Before Deployment:
- [ ] All 36 tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Responsive on all devices
- [ ] Loading states visible
- [ ] Error messages helpful
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Data privacy verified
- [ ] PDF downloads work
- [ ] All filters functional
- [ ] Navigation working
- [ ] Styling consistent
- [ ] Documentation complete

### Documentation:
- [ ] Features documented
- [ ] API integration documented
- [ ] Error scenarios documented
- [ ] User guide created
- [ ] Testing results recorded

### Deployment:
- [ ] Code reviewed
- [ ] Peer tested
- [ ] QA approved
- [ ] Ready for production

---

**Testing Status**: Ready to Begin

**Date**: May 31, 2026
**Version**: 1.0

---

## 🎯 Test Execution Log

| Test # | Name | Status | Notes | Date |
|--------|------|--------|-------|------|
| 1 | Navigate to Payment History | ⏳ | Pending | - |
| 2 | View Summary Cards | ⏳ | Pending | - |
| 3 | Payment List Display | ⏳ | Pending | - |
| ... | ... | ⏳ | ... | - |

Update this table as tests are executed.

# Payment History Feature - Visual Guide

## 🎨 User Interface Overview

### Payment History Page Layout (`/payments`)

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER - Navigation                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SIDEBAR - Customer Menu                   │
│  • Dashboard    ◀─ Currently here ─→  Lịch sử thanh toán   │
│  • My Bookings                       ○ Notifications        │
│  ◆ Payment History                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   MAIN CONTENT AREA                         │
│                                                             │
│  ┌─── SUMMARY CARDS ───────────────────────────────────┐   │
│  │                                                     │   │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────────┐      │   │
│  │ │ ₫50M    │  │ 15 Giao │  │ 2 Đang Chờ │  │   │   │
│  │ │Thanh    │  │Dịch    │  │             │  │   │   │
│  │ │Toán     │  │         │  │             │  │   │   │
│  │ └──────────┘  └──────────┘  └──────────────┘      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── FILTER CONTROLS ─────────────────────────────────┐   │
│  │ [Status ▼] [Gateway ▼] [Search...] [Date...]        │   │
│  │ [🔄 Đặt lại bộ lọc]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── TRANSACTION LIST ────────────────────────────────┐   │
│  │                                                     │   │
│  │ 🟢 PAID  | PayPal  | BOOKING001 | Full    | ₫5M    │   │
│  │ └─ 31/05/2026 14:30  [Chi tiết]                   │   │
│  │                                                     │   │
│  │ 🟡 PENDING | VNPay | BOOKING002 | Deposit | ₫2M   │   │
│  │ └─ 30/05/2026 10:15  [Chi tiết]                   │   │
│  │                                                     │   │
│  │ 🟢 PAID  | Cash   | BOOKING003 | Full    | ₫8M    │   │
│  │ └─ 29/05/2026 16:45  [Chi tiết]                   │   │
│  │                                                     │   │
│  │ [Load more or pagination]                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FOOTER                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Layout

### Portrait (375px width)

```
┌─────────────────┐
│  ≡  HEADER      │
├─────────────────┤
│                 │
│ Summary Cards   │
│ (Stacked)       │
│                 │
│ ┌─────────────┐ │
│ │ ₫50M        │ │
│ │ Thanh Toán  │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ 15 Giao Dịch│ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ 2 Đang Chờ  │ │
│ └─────────────┘ │
│                 │
│ Filters         │
│ [Status ▼]      │
│ [Gateway ▼]     │
│ [Search...]     │
│ [Date...]       │
│                 │
│ Transactions    │
│                 │
│ 🟢 PAID PayPal  │
│    BOOKING001   │
│    ₫5M          │
│    [Chi tiết]   │
│                 │
│ 🟡 PENDING VNP  │
│    BOOKING002   │
│    ₫2M          │
│    [Chi tiết]   │
│                 │
└─────────────────┘
```

---

## 🖼️ Details Modal

### Payment Details Modal Layout

```
┌───────────────────────────────────────────┐
│                                           │
│  PAYMENT DETAILS              [X] Close   │
│                                           │
├───────────────────────────────────────────┤
│                                           │
│  Status: ✅ PAID                          │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ TRANSACTION INFORMATION             │  │
│  ├─────────────────────────────────────┤  │
│  │ Transaction ID: P-2026-05-31-001    │  │
│  │ Payment Type: FULL PAYMENT          │  │
│  │ Gateway: PayPal                     │  │
│  │ Amount: ₫5,000,000 VND              │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ PAYMENT TIMELINE                    │  │
│  ├─────────────────────────────────────┤  │
│  │ Created: 31/05/2026 14:20           │  │
│  │ Paid:    31/05/2026 14:30           │  │
│  │ Refunded: -                         │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ GATEWAY REFERENCE                   │  │
│  ├─────────────────────────────────────┤  │
│  │ Ref ID: PAY-2026-31-ABC123XYZ       │  │
│  │ Transaction ID: TXN-987654321       │  │
│  │ Booking Code: BOOKING001            │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  [Tải hóa đơn PDF] [Đóng]                │
│                                           │
└───────────────────────────────────────────┘
```

---

## 🎯 ProfilePage Tab System

### Before (Original Profile)

```
┌──────────────────────────────────┐
│      PROFILE PAGE                │
│                                  │
│  Personal Information            │
│  ├─ Name                        │
│  ├─ Email                       │
│  ├─ Phone                       │
│  ├─ Address                     │
│  └─ ID Documents                │
│                                  │
│  [Edit Profile] [Save Changes]   │
│                                  │
└──────────────────────────────────┘
```

### After (With Tabs)

```
┌──────────────────────────────────┐
│      PROFILE PAGE                │
│                                  │
│  [✏️ Hồ sơ] [💳 Giao dịch]       │
│  ─────────────────────────────   │
│                                  │
│  TAB: HỒ SƠ                      │
│  Personal Information            │
│  ├─ Name                        │
│  ├─ Email                       │
│  ├─ Phone                       │
│  ├─ Address                     │
│  └─ ID Documents                │
│  [Edit Profile] [Save Changes]   │
│                                  │
│  OR (When switched to Giao dịch):
│                                  │
│  TAB: GIAO DỊCH                  │
│  ┌──────────────────────────────┐│
│  │ Summary:                     ││
│  │ • ₫50M Thanh Toán           ││
│  │ • 15 Giao Dịch              ││
│  ├──────────────────────────────┤│
│  │ Filter:                      ││
│  │ [ALL] [PENDING] [PAID]...    ││
│  ├──────────────────────────────┤│
│  │ Recent Transactions (5):     ││
│  │ • BOOKING001 - ₫5M - PAID    ││
│  │ • BOOKING002 - ₫2M - PENDING││
│  │ • BOOKING003 - ₫8M - PAID    ││
│  ├──────────────────────────────┤│
│  │ [Xem tất cả giao dịch →]     ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

---

## 🎨 Status Colors

```
PENDING Status
┌─────────────────────┐
│ 🟡 Chờ xử lý        │  Orange color
│ Awaiting payment    │  text-orange-600
│ Timer: --:-- left   │  bg-orange-50
└─────────────────────┘

PAID Status
┌─────────────────────┐
│ ✅ Đã thanh toán    │  Green color
│ Successfully paid   │  text-green-600
│ Completed           │  bg-green-50
└─────────────────────┘

FAILED Status
┌─────────────────────┐
│ ❌ Thất bại         │  Red color
│ Transaction failed  │  text-red-600
│ Reason: ...         │  bg-red-50
└─────────────────────┘

REFUNDED Status
┌─────────────────────┐
│ 🔄 Hoàn tiền        │  Blue color
│ Money refunded      │  text-blue-600
│ Completed           │  bg-blue-50
└─────────────────────┘

EXPIRED Status
┌─────────────────────┐
│ ⏱️ Hết hạn          │  Gray color
│ Payment expired     │  text-gray-600
│ Must rebook         │  bg-gray-50
└─────────────────────┘
```

---

## 🏷️ Gateway Icons/Badges

```
PayPal
┌─────────────────────┐
│ 🅿️ PayPal          │  Blue badge
│ Credit Card         │  International payment
└─────────────────────┘

VNPay
┌─────────────────────┐
│ 📱 VNPay            │  Indigo badge
│ QR Code Scan        │  Vietnamese payment
└─────────────────────┘

Cash
┌─────────────────────┐
│ 💵 Tiền mặt         │  Green badge
│ Counter Payment     │  On-site payment
└─────────────────────┘
```

---

## 🔍 Filter Panel

### Status Filter

```
[Lọc theo trạng thái ▼]

┌─────────────────────┐
│ ○ ALL               │ (Default)
│ ○ PENDING           │ (Orange)
│ ○ PAID              │ (Green)
│ ○ FAILED            │ (Red)
│ ○ REFUNDED          │ (Blue)
│ ○ EXPIRED           │ (Gray)
└─────────────────────┘

Or Quick Buttons:
[ALL] [PENDING] [PAID] [FAILED] [REFUNDED] [EXPIRED]
```

### Gateway Filter

```
[Lọc theo phương thức ▼]

┌─────────────────────┐
│ ○ ALL               │
│ ○ PAYPAL            │
│ ○ VNPAY             │
│ ○ CASH              │
└─────────────────────┘
```

### Search Filter

```
[Tìm kiếm mã đặt xe hoặc ID...]
│
└─ Real-time search
```

### Date Range Filter

```
[Từ ngày ▼] ───── [Đến ngày ▼]
```

### Reset Button

```
[🔄 Đặt lại bộ lọc]
```

---

## 📊 Transaction List - Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ GATEWAY │ STATUS │ CODE       │ TYPE     │ AMOUNT  │ DATE      │
├────────────────────────────────────────────────────────────────┤
│ 🅿️ PayP │ ✅ PAID│ BOOKING001 │ Full Pay │ ₫5M     │ 31/05 14:3│
│ 📱 VNPay│ 🟡 PEN │ BOOKING002 │ Deposit  │ ₫2M     │ 30/05 10:1│
│ 💵 Cash │ ✅ PAID│ BOOKING003 │ Full Pay │ ₫8M     │ 29/05 16:4│
│ 🅿️ PayP │ ❌ FAL │ BOOKING004 │ Deposit  │ ₫3M     │ 28/05 09:0│
│ 📱 VNPay│ ✅ PAID│ BOOKING005 │ Extra Ch │ ₫1.5M   │ 27/05 15:2│
└────────────────────────────────────────────────────────────────┘

[Chi tiết] [Chi tiết] [Chi tiết] [Chi tiết] [Chi tiết]
```

---

## 📋 Transaction List - Mobile

```
┌────────────────────────────┐
│ 🟢 PAID  | PayPal          │
│ BOOKING001                 │
│ ₫5,000,000                 │
│ 31/05/2026 14:30           │
│ [Chi tiết]                 │
├────────────────────────────┤
│ 🟡 PENDING | VNPay         │
│ BOOKING002                 │
│ ₫2,000,000                 │
│ 30/05/2026 10:15           │
│ [Chi tiết]                 │
├────────────────────────────┤
│ 🟢 PAID | Cash             │
│ BOOKING003                 │
│ ₫8,000,000                 │
│ 29/05/2026 16:45           │
│ [Chi tiết]                 │
└────────────────────────────┘
```

---

## 🗺️ Navigation Flow

```
LANDING PAGE
     │
     └─► LOGIN/REGISTER
          │
          └─► CUSTOMER DASHBOARD
               │
               ├─► [Sidebar Link: Lịch sử thanh toán]
               │    └─► /payments ◄── PAYMENT HISTORY PAGE
               │
               ├─► PROFILE PAGE
               │    ├─ Tab: Hồ sơ (Profile info)
               │    └─ Tab: Giao dịch
               │         ├─ Summary + Recent 5
               │         └─► [Xem tất cả] ──► /payments
               │
               ├─► MY BOOKINGS
               │    └─► BOOKING DETAIL
               │         └─► [View Payment History] ──► /payments
               │
               └─► NOTIFICATIONS

IN PAYMENT HISTORY PAGE:
    ├─ View Summary Cards
    ├─ Apply Filters
    ├─ Search Transactions
    ├─ Click [Chi tiết] → Modal
    │  ├─ View full details
    │  └─ [Tải hóa đơn] → Download PDF
    └─ Go Back or Close
```

---

## 📈 Data Visualization

### Summary Cards Flow

```
All Transactions (Backend)
    │
    ├─► Filter 1: Status = PAID
    │   │
    │   └─► Sum all amounts
    │        = Total Thanh Toán
    │
    ├─► Filter 2: Count all
    │   │
    │   └─► = Total Giao Dịch
    │
    └─► Filter 3: Status = PENDING
        │
        └─► = Đang Chờ count
```

### Filtering Flow

```
User Input
    ├─ Status selected
    ├─ Gateway selected
    ├─ Search term entered
    ├─ Date range selected
    │
    └─► Apply Filters Simultaneously
        │
        ├─► Filter transactions
        ├─► Update summary cards
        ├─► Update list display
        └─► Recalculate counts
```

---

## 🎯 Button Locations

### PaymentsPage Buttons

```
[🔄 Đặt lại bộ lọc]        Top right of filter panel
[Chi tiết] per transaction Bottom right of each row
[Tải hóa đơn]             Inside details modal
[Đóng Modal]              Top right of modal
[Xem tất cả]              In ProfilePage TransactionsTab
```

### ProfilePage Buttons

```
[✏️ Hồ sơ]                 Tab button (green when active)
[💳 Giao dịch]             Tab button (green when active)
[Xem tất cả giao dịch]     Bottom of TransactionsTab
```

### Sidebar Navigation

```
[Lịch sử thanh toán]       Navigation link with CreditCard icon
```

---

## ✨ Visual Hierarchy

### Page Elements Importance

```
Level 1 (Most Important)
├─ Summary Cards (High impact metrics)
└─ Transaction List (Main content)

Level 2 (Supporting)
├─ Filter Controls (Help user find data)
├─ Details Modal (Detailed info)
└─ Status Badges (Quick status recognition)

Level 3 (Navigation)
├─ Links (Sidebar, tabs)
├─ Buttons (Actions)
└─ Icons (Visual aids)
```

---

## 🎨 Color Usage

```
Primary Actions:
├─ Green (#78ad44) - Active, highlights, call-to-action
└─ Gray (#212529) - Secondary actions

Status Indicators:
├─ Orange - Pending (needs attention)
├─ Green - Success (completed)
├─ Red - Error (failed)
├─ Blue - Refund (reversed)
└─ Gray - Expired (closed)

Backgrounds:
├─ White - Cards
├─ Light Gray - Page background
└─ Very Light - Hover states

Text:
├─ Dark Gray - Primary text
├─ Medium Gray - Secondary text
└─ Light Gray - Disabled text
```

---

**Visual Guide Complete** - Ready for implementation review


export const ROUTES = {
  // Public
  HOME: '/',
  SEARCH: '/search',
  VEHICLE_DETAIL: '/vehicles/:id',

  // Auth (Modal covers this, but we keep routes if needed for deep linking)
  LOGIN: '/login',
  REGISTER: '/register',

  // Booking Flow (Customer - Protected)
  BOOKING: '/booking/:id',
  BOOKING_CONFIRM: '/booking/:id/confirm',
  PAYMENT: '/booking/:id/payment',
  PAYMENT_PAYPAL: '/booking/:id/payment/paypal',
  PAYMENT_VNPAY: '/booking/:id/payment/vnpay',
  PAYMENT_RESULT: '/booking/:id/result',

  // Customer Profile & My Bookings (Protected)
  PROFILE: '/profile',
  PAYMENTS: '/payments',
  MY_BOOKINGS: '/my-bookings',
  BOOKING_DETAIL: '/my-bookings/:id',
  NOTIFICATIONS: '/notifications',

  // Admin Dashboard (Admin Only)
  ADMIN: '/admin',
  ADMIN_VEHICLES: '/admin/vehicles',
  ADMIN_BOOKINGS: '/admin/bookings',
} as const;

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/store/authStore';
import { BookingProvider } from '@/store/bookingStore';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ROUTES } from '@/constants/routes';
import Spinner from '@/components/ui/Spinner';

// Components (Global, keep static)
import AuthModal from '@/components/auth/AuthModal';

// Pages (Lazy loaded for Code Splitting & Performance)
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage'));

const BookingPage = lazy(() => import('@/pages/BookingPage'));
const BookingConfirmPage = lazy(() => import('@/pages/BookingConfirmPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const PayPalRedirect = lazy(() => import('@/pages/PaymentPage/PayPalRedirect'));
const VNPayQR = lazy(() => import('@/pages/PaymentPage/VNPayQR'));
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'));

const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'));
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage'));
const BookingDetailPage = lazy(() => import('@/pages/BookingDetailPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminVehicles = lazy(() => import('@/pages/AdminVehicles'));
const AdminBookings = lazy(() => import('@/pages/AdminBookings'));

// Loading Fallback Full Screen
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
        {/* Global Toast */}
        <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />

        {/* Global Auth Modal */}
        <AuthModal />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ─── Public ─── */}
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            <Route path={ROUTES.SEARCH} element={<SearchPage />} />
            <Route path={ROUTES.VEHICLE_DETAIL} element={<VehicleDetailPage />} />

            {/* ─── Booking Flow (Customer) ─── */}
            <Route path={ROUTES.BOOKING} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingPage /></ProtectedRoute>} />
            <Route path={ROUTES.BOOKING_CONFIRM} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingConfirmPage /></ProtectedRoute>} />
            <Route path={ROUTES.PAYMENT} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PaymentPage /></ProtectedRoute>} />
            <Route path={ROUTES.PAYMENT_PAYPAL} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PayPalRedirect /></ProtectedRoute>} />
            <Route path={ROUTES.PAYMENT_VNPAY} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><VNPayQR /></ProtectedRoute>} />
            <Route path={ROUTES.PAYMENT_RESULT} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PaymentResultPage /></ProtectedRoute>} />

            {/* ─── User Profile & Dashboard ─── */}
            <Route path={ROUTES.PROFILE} element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path={ROUTES.PAYMENTS} element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path={ROUTES.MY_BOOKINGS} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookingsPage /></ProtectedRoute>} />
            <Route path={ROUTES.BOOKING_DETAIL} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingDetailPage /></ProtectedRoute>} />
            <Route path={ROUTES.NOTIFICATIONS} element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* ─── Admin ─── */}
            <Route path={ROUTES.ADMIN} element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><AdminDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.ADMIN_VEHICLES} element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><AdminVehicles /></ProtectedRoute>} />
            <Route path={ROUTES.ADMIN_BOOKINGS} element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><AdminBookings /></ProtectedRoute>} />

            {/* ─── Fallback ─── */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </Suspense>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

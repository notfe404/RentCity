import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Check, AlertCircle, Car } from 'lucide-react';

import BookingStepper from '@/components/booking/BookingStepper';
import BookingSidebar from '@/components/booking/BookingSidebar';
import { MOCK_VEHICLES } from '@/data/mockVehicles';
import { MOCK_LOCATIONS } from '@/data/mockLocations';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/store/bookingStore';
import { formatVND } from '@/utils/formatters';

const EXTRAS_CONFIG = [
  { key: 'insurance' as const, label: 'Bảo hiểm toàn diện',    pricePerDay: 200000 },
  { key: 'childSeat' as const, label: 'Ghế trẻ em (0-4 tuổi)', pricePerDay: 100000 },
  { key: 'gps'       as const, label: 'Bộ định vị GPS',         pricePerDay: 50000  },
];

export default function BookingConfirmPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);

  const {
    startDate,
    endDate,
    pickupLocationId,
    returnLocationId,
    extras,
    discountAmount,
    totalDays,
    baseAmount,
    totalAmount,
  } = useBooking();

  const vehicle = MOCK_VEHICLES.find(v => v.id === id);

  const pickupName = MOCK_LOCATIONS.find(l => l.id === pickupLocationId)?.name ?? 'CN Hoàn Kiếm';
  const returnName = MOCK_LOCATIONS.find(l => l.id === returnLocationId)?.name ?? 'CN Hoàn Kiếm';

  const lineItems = [
    { label: `Thuê xe (${totalDays} ngày)`, amount: baseAmount },
    ...EXTRAS_CONFIG.filter(e => extras[e.key]).map(e => ({
      label: e.label,
      amount: e.pricePerDay * totalDays,
    })),
    ...(discountAmount > 0 ? [{ label: 'Giảm giá', amount: -discountAmount }] : []),
  ];

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><Car size={48} /></div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Không tìm thấy xe</h2>
            <p className="text-gray-500 mb-8">Xe bạn đang tìm không tồn tại.</p>
            <button onClick={() => navigate('/search')} className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg">Quay lại tìm xe</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <BookingStepper currentStep={2} />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main */}
          <div className="flex-1 w-full space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Xem lại đặt xe</h2>
              <p className="text-sm font-medium text-gray-500 mb-8">Vui lòng kiểm tra thông tin trước khi thanh toán.</p>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="p-5 border border-gray-100 rounded-2xl bg-[#f4f8f7]">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin khách hàng</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-medium">
                    <div><span className="text-gray-400 block mb-1">Họ tên</span><span className="text-gray-900">{user?.fullName ?? 'Khách'}</span></div>
                    <div><span className="text-gray-400 block mb-1">Email</span><span className="text-gray-900">{user?.email ?? '—'}</span></div>
                    <div><span className="text-gray-400 block mb-1">Điện thoại</span><span className="text-gray-900">{user?.phone ?? '—'}</span></div>
                  </div>
                </div>

                {/* Extras — dynamic từ booking store */}
                <div className="p-5 border border-gray-100 rounded-2xl bg-[#f4f8f7]">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Dịch vụ đã chọn</h3>
                  <ul className="space-y-2 text-sm font-medium text-gray-700">
                    {EXTRAS_CONFIG.map(e =>
                      extras[e.key] ? (
                        <li key={e.key} className="flex items-center gap-2">
                          <Check size={16} className="text-[#78ad44]" />
                          {e.label} — {formatVND(e.pricePerDay * totalDays)}
                        </li>
                      ) : (
                        <li key={e.key} className="flex items-center gap-2 text-gray-400">
                          <XIcon /> {e.label} (Chưa chọn)
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Cancellation Policy */}
                <div className="p-5 border border-[#78ad44]/30 rounded-2xl bg-[#78ad44]/5 flex items-start gap-4">
                  <AlertCircle className="text-[#78ad44] shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Chính sách hủy</h4>
                    <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                      Hủy miễn phí trước 48 giờ nhận xe. Nếu hủy trong vòng 48 giờ, phí hủy 50% sẽ được áp dụng.
                    </p>
                  </div>
                </div>

                {/* Agreement */}
                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <input
                    type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44]"
                  />
                  <span className="text-sm font-medium text-gray-600 leading-relaxed">
                    Tôi đã đọc và đồng ý với{' '}
                    <a href="#" className="text-[#78ad44] hover:underline font-bold">Điều khoản sử dụng</a>{' '}và{' '}
                    <a href="#" className="text-[#78ad44] hover:underline font-bold">Chính sách bảo mật</a>.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <BookingSidebar
            vehicle={vehicle}
            pickupLocation={pickupName}
            returnLocation={returnName}
            startDate={startDate}
            endDate={endDate}
            totalDays={totalDays}
            lineItems={lineItems}
            totalAmount={totalAmount}
            actionLabel="Tiếp tục thanh toán"
            actionDisabled={!agreed}
            onAction={() => navigate(`/booking/${id}/payment`)}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Shield, Baby, Navigation, Tag, Car } from 'lucide-react';
import { toast } from 'sonner';

import BookingStepper from '@/components/booking/BookingStepper';
import BookingSidebar from '@/components/booking/BookingSidebar';
import { MOCK_LOCATIONS } from '@/data/mockLocations';
import { getCarById } from '@/services/carApi';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/store/bookingStore';
import { formatVND } from '@/utils/formatters';

const EXTRAS = [
  {
    key: 'insurance' as const,
    icon: Shield,
    label: 'Bảo hiểm toàn diện',
    desc: 'Bảo hiểm thiệt hại, mất cắp với mức khấu trừ 0₫. Yên tâm trên mọi hành trình.',
    pricePerDay: 200000,
  },
  {
    key: 'childSeat' as const,
    icon: Baby,
    label: 'Ghế trẻ em (0-4 tuổi)',
    desc: 'Ghế an toàn tiêu chuẩn Châu Âu cho trẻ sơ sinh và trẻ nhỏ.',
    pricePerDay: 100000,
  },
  {
    key: 'gps' as const,
    icon: Navigation,
    label: 'Bộ định vị GPS',
    desc: 'Thiết bị dẫn đường riêng, không phụ thuộc mạng điện thoại.',
    pricePerDay: 50000,
  },
];

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicleData] = useState<DisplayVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    vehicle: bookingVehicle,
    startDate,
    endDate,
    pickupLocationId,
    returnLocationId,
    extras,
    customerNote,
    promotionCode,
    discountAmount,
    durationLabel,
    totalDays,
    baseAmount,
    depositAmount,
    totalAmount,
    setVehicle,
    toggleExtra,
    setCustomerNote,
    setPromotionCode,
    applyPromotion,
  } = useBooking();

  const [promoTried, setPromoTried] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getCarById(id);
        if (!cancelled) {
          setVehicleData(mapApiCarToDisplayVehicle(data));
        }
      } catch {
        if (!cancelled) {
          toast.error('Không tải được xe từ backend');
          setVehicleData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (vehicle && (!bookingVehicle || bookingVehicle.id !== vehicle.id)) {
      setVehicle(vehicle);
    }
  }, [vehicle, bookingVehicle, setVehicle]);

  const applyPromo = () => {
    applyPromotion();
    setPromoTried(true);
  };

  const vehicleBranchName = vehicle?.branchName;
  const pickupName = MOCK_LOCATIONS.find((l) => l.id === pickupLocationId)?.name ?? vehicleBranchName ?? 'Theo chi nhánh của xe';
  const returnName = MOCK_LOCATIONS.find((l) => l.id === returnLocationId)?.name ?? vehicleBranchName ?? 'Theo chi nhánh của xe';

  const lineItems = [
    { label: `Thuê xe (${durationLabel})`, amount: baseAmount },
    ...EXTRAS.filter((e) => extras[e.key]).map((e) => ({ label: e.label, amount: e.pricePerDay * totalDays })),
    ...(discountAmount > 0 ? [{ label: 'Giảm giá', amount: -discountAmount }] : []),
  ];

  if (!vehicle) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
          <Header />
          <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Đang tải xe...</div>
          <Footer />
        </div>
      );
    }
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
        <BookingStepper currentStep={1} />

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 w-full space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Thông tin người thuê</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Họ và tên</label>
                  <input type="text" defaultValue={user?.fullName ?? ''} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Email</label>
                  <input type="email" defaultValue={user?.email ?? ''} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Số điện thoại</label>
                  <input type="text" defaultValue={user?.phone ?? ''} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Ghi chú</label>
                  <input
                    type="text"
                    placeholder="VD: Cần ghế trẻ em thêm..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Dịch vụ bổ sung</h2>
              <div className="space-y-4">
                {EXTRAS.map((ext) => (
                  <label
                    key={ext.key}
                    className={`flex items-start p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      extras[ext.key] ? 'border-[#78ad44] bg-[#f4f8f7]' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={extras[ext.key]}
                      onChange={() => toggleExtra(ext.key)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44] cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-900 flex items-center gap-2">
                          <ext.icon size={18} className="text-[#78ad44]" /> {ext.label}
                        </span>
                        <span className="font-black text-[#78ad44]">{formatVND(ext.pricePerDay)} / ngày</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{ext.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Tag size={22} className="text-[#78ad44]" /> Mã khuyến mãi
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={promotionCode}
                  onChange={(e) => {
                    setPromotionCode(e.target.value);
                    setPromoTried(false);
                  }}
                  className="flex-1 bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-bold uppercase tracking-wider"
                />
                <button
                  onClick={applyPromo}
                  className="bg-[#212529] hover:bg-[#111] text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>
              {promoTried && discountAmount > 0 && (
                <p className="mt-3 text-sm font-bold text-[#78ad44]">✓ Đã áp dụng giảm {formatVND(discountAmount)}</p>
              )}
              {promoTried && discountAmount === 0 && promotionCode && (
                <p className="mt-3 text-sm font-bold text-red-500">✕ Mã không hợp lệ</p>
              )}
              <p className="mt-2 text-xs text-gray-400 font-medium">Thử mã: RENTCITY10 (giảm 10%)</p>
            </div>
          </div>

          <BookingSidebar
            vehicle={vehicle}
            pickupLocation={pickupName}
            returnLocation={returnName}
            startDate={startDate}
            endDate={endDate}
            durationLabel={durationLabel}
            lineItems={lineItems}
            depositAmount={depositAmount}
            totalAmount={totalAmount}
            actionLabel="Tiếp tục xác nhận"
            onAction={() => navigate(`/booking/${id}/confirm`)}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

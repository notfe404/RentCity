import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Shield, Car, Wallet, Smartphone, CreditCard, Building2 } from 'lucide-react';

import BookingStepper from '@/components/booking/BookingStepper';
import { MOCK_VEHICLES } from '@/data/mockVehicles';
import { useBooking } from '@/store/bookingStore';
import { formatVND } from '@/utils/formatters';

type PaymentMethod = 'vnpay' | 'momo' | 'zalopay' | 'bank' | 'cash';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; desc: string; icon: typeof Wallet; color: string }[] = [
  { key: 'vnpay',   label: 'VNPay',       desc: 'Thanh toán qua ứng dụng VNPay hoặc thẻ ATM/Visa/Master',   icon: CreditCard,  color: '#005baa' },
  { key: 'momo',    label: 'Ví MoMo',     desc: 'Thanh toán nhanh qua ví điện tử MoMo',                     icon: Smartphone,  color: '#ae2070' },
  { key: 'zalopay', label: 'ZaloPay',     desc: 'Thanh toán qua ví ZaloPay hoặc thẻ liên kết',              icon: Wallet,      color: '#008fe5' },
  { key: 'bank',    label: 'Chuyển khoản',desc: 'Chuyển khoản ngân hàng trực tiếp theo thông tin bên dưới', icon: Building2,   color: '#059669' },
  { key: 'cash',    label: 'Tiền mặt',    desc: 'Thanh toán tại quầy khi nhận xe',                          icon: Wallet,      color: '#d97706' },
];

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const { totalDays, baseAmount, extrasAmount, discountAmount, totalAmount, reset } = useBooking();

  const vehicle = MOCK_VEHICLES.find(v => v.id === id);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      reset();
      navigate(`/booking/${id || '1'}/result`);
    }, 2000);
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><Car size={48} /></div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Không tìm thấy đơn</h2>
            <button onClick={() => navigate('/search')} className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg mt-4">Quay lại tìm xe</button>
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
        <BookingStepper currentStep={3} />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main */}
          <div className="flex-1 w-full space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Phương thức thanh toán</h2>
              <p className="text-sm font-medium text-gray-500 mb-8">Chọn phương thức thanh toán phù hợp với bạn.</p>

              <div className="space-y-3">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.key}
                    onClick={() => setMethod(pm.key)}
                    className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${
                      method === pm.key
                        ? 'border-[#78ad44] bg-[#f4f8f7]'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: pm.color + '15', color: pm.color }}
                    >
                      <pm.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{pm.label}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          method === pm.key ? 'border-[#78ad44] bg-[#78ad44]' : 'border-gray-300'
                        }`}>
                          {method === pm.key && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mt-1">{pm.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank transfer details */}
            {method === 'bank' && (
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-300">
                <h3 className="text-xl font-black text-gray-900 mb-6">Thông tin chuyển khoản</h3>
                <div className="bg-[#f4f8f7] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Ngân hàng</span>
                    <span className="font-bold text-gray-900">Vietcombank</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Số tài khoản</span>
                    <span className="font-bold text-gray-900 font-mono">1234 5678 9012</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Chủ tài khoản</span>
                    <span className="font-bold text-gray-900">CONG TY RENT CITY</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Nội dung CK</span>
                    <span className="font-bold text-[#78ad44] font-mono">RC{id}THANHTOAN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Số tiền</span>
                    <span className="font-black text-[#78ad44]">{formatVND(totalAmount)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-medium mt-4">
                  Đơn hàng sẽ được xác nhận sau khi chúng tôi nhận được tiền (thường trong 15 phút).
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[400px] shrink-0">
            <div className="sticky top-24 bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 flex flex-col gap-6">
              <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 px-2">Tóm tắt thanh toán</h3>

              <div className="flex gap-4 items-center bg-[#f4f8f7] p-3 rounded-2xl">
                <img src={vehicle.image} alt={vehicle.name} className="w-24 h-16 object-cover rounded-xl shadow-sm" />
                <div>
                  <h4 className="font-black text-gray-900">{vehicle.name}</h4>
                  <p className="text-xs text-gray-500 font-bold mt-1">{vehicle.type}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 px-2">
                <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
                  <span>Thuê xe ({totalDays} ngày)</span>
                  <span>{formatVND(baseAmount)}</span>
                </div>
                {extrasAmount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
                    <span>Dịch vụ bổ sung</span>
                    <span>{formatVND(extrasAmount)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-[#78ad44] mb-3">
                    <span>Giảm giá</span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-black text-gray-900 mt-6 bg-[#212529] text-white p-4 rounded-xl">
                  <span>Thanh toán</span>
                  <span className="text-[#78ad44]">{formatVND(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full text-white font-bold rounded-2xl py-4 transition-all shadow-lg mt-2 flex justify-center items-center gap-2 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-wait shadow-none'
                    : 'bg-[#78ad44] hover:bg-[#689938] shadow-[#78ad44]/30'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Thanh toán ${formatVND(totalAmount)}`
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                <Shield size={14} /> Mã hóa SSL an toàn
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

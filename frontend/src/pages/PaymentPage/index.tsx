import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  History,
  Receipt,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';

import BookingStepper from '@/components/booking/BookingStepper';
import { getMyBooking } from '@/services/bookingApi';
import {
  createDepositPayment,
  getMyPayments,
} from '@/services/paymentApi';
import { DEPOSIT_STATUS_META, getBookingVehicleImage, getBookingVehicleName } from '@/utils/bookingMapper';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type { ApiBookingResponse, ApiPaymentResponse, PaymentGateway } from '@/types';

interface PaymentMethod {
  gateway: PaymentGateway;
  title: string;
  description: string;
  icon: ReactNode;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    gateway: 'PAYPAL',
    title: 'PayPal',
    description: 'Thanh toán an toàn qua PayPal. Chuyển hướng đến trang PayPal để hoàn tất.',
    icon: <WalletCards size={22} />,
  },
  {
    gateway: 'VNPAY',
    title: 'VNPay',
    description: 'Quét mã QR để thanh toán. Hỗ trợ tất cả ngân hàng và ví điện tử.',
    icon: <CreditCard size={22} />,
  },
];

const PAYMENT_STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: 'text-orange-500' },
  PAID: { label: 'Đã thanh toán', color: 'text-[#78ad44]' },
  FAILED: { label: 'Thất bại', color: 'text-red-500' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-gray-500' },
  EXPIRED: { label: 'Hết hạn', color: 'text-gray-500' },
};

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [payments, setPayments] = useState<ApiPaymentResponse[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('VNPAY');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getMyBooking(id);
        if (cancelled) {
          return;
        }
        setBooking(data);

        try {
          const paymentsResponse = await getMyPayments();
          if (!cancelled) {
            setPayments(paymentsResponse.data.filter((payment) => payment.bookingId === data.id));
          }
        } catch {
          if (!cancelled) {
            setPayments([]);
          }
        }
      } catch {
        if (!cancelled) {
          toast.error('Không tải được thông tin booking');
          navigate('/my-bookings', { replace: true });
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
  }, [id, navigate]);

  const latestPayment = useMemo(() => payments[0] ?? null, [payments]);

  const handleCreatePayment = async () => {
    if (!booking || isPaying) {
      return;
    }

    if (booking.status !== 'PENDING' || booking.depositStatus !== 'UNPAID') {
      toast.error('Booking này không còn ở trạng thái cần thanh toán cọc');
      return;
    }

    setIsPaying(true);
    try {
      // For online payments, redirect to gateway-specific pages
      if (selectedGateway === 'PAYPAL') {
        navigate(`/booking/${booking.id}/payment/paypal`);
        return;
      }

      if (selectedGateway === 'VNPAY') {
        navigate(`/booking/${booking.id}/payment/vnpay`);
        return;
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Đang tải booking...</div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const depositMeta = DEPOSIT_STATUS_META[booking.depositStatus];
  const vehicleImage = getBookingVehicleImage(booking);
  const vehicleName = getBookingVehicleName(booking);
  const canPay = booking.status === 'PENDING' && booking.depositStatus === 'UNPAID';

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        <BookingStepper currentStep={3} />

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-10">
          <div className="space-y-8">
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#fff7e8] flex items-center justify-center text-orange-500 shrink-0">
                  <Clock3 size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Thanh toán cọc booking</h1>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed">
                    Booking <span className="font-black text-gray-900">{booking.bookingCode}</span> đang chờ thanh toán
                    cọc để chuyển sang trạng thái xác nhận.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Chọn phương thức thanh toán</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.gateway}
                    type="button"
                    onClick={() => setSelectedGateway(method.gateway)}
                    disabled={!canPay || isPaying}
                    className={`text-left rounded-2xl border-2 p-5 transition-all disabled:opacity-60 ${
                      selectedGateway === method.gateway
                        ? 'border-[#78ad44] bg-[#f4f8f7] shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-11 h-11 rounded-xl bg-[#212529] text-white flex items-center justify-center">
                        {method.icon}
                      </span>
                      <span className="font-black text-gray-900">{method.title}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed">{method.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreatePayment}
                disabled={!canPay || isPaying}
                className="mt-6 w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={18} />
                {isPaying ? 'Đang xử lý...' : 'Thanh toán cọc'}
              </button>

              {!canPay && (
                <p className="mt-4 text-sm font-bold text-gray-500">
                  Booking này đã có trạng thái cọc: <span className={depositMeta.color}>{depositMeta.label}</span>.
                </p>
              )}
            </section>

            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <History size={22} className="text-[#78ad44]" />
                <h2 className="text-2xl font-black text-gray-900">Lịch sử thanh toán</h2>
              </div>

              {payments.length === 0 ? (
                <p className="text-sm font-bold text-gray-500">Chưa có giao dịch nào cho booking này.</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const statusMeta = PAYMENT_STATUS_META[payment.status];
                    return (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f4f8f7] rounded-2xl p-4">
                        <div>
                          <p className="font-black text-gray-900">{payment.gateway} #{payment.id}</p>
                          <p className="text-xs font-bold text-gray-500 mt-1">{formatDateTime(payment.createdAt)}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="font-black text-[#78ad44]">{formatVND(payment.amount)}</p>
                          <p className={`text-xs font-black mt-1 ${statusMeta.color}`}>{statusMeta.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 px-2 mb-6">Tóm tắt booking</h3>
              <div className="flex gap-4 items-center bg-[#f4f8f7] p-3 rounded-2xl mb-6">
                {vehicleImage ? (
                  <img src={vehicleImage} alt={vehicleName} className="w-24 h-16 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-gray-200" />
                )}
                <div>
                  <h4 className="font-black text-gray-900">{vehicleName}</h4>
                  <p className="text-xs text-gray-500 font-bold mt-1">{booking.vehicleLicensePlate ?? 'Chưa có biển số'}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm font-bold text-gray-600 px-2">
                <div className="flex justify-between gap-4">
                  <span>Nhận xe</span>
                  <span className="text-gray-900 text-right">{formatDateTime(booking.startTime)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Trả xe</span>
                  <span className="text-gray-900 text-right">{formatDateTime(booking.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng tiền</span>
                  <span className="text-[#78ad44]">{formatVND(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền cọc</span>
                  <span className="text-[#78ad44]">{formatVND(booking.depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái cọc</span>
                  <span className={depositMeta.color}>{depositMeta.label}</span>
                </div>
              </div>

              {latestPayment && (
                <div className="mt-6 bg-[#f4f8f7] rounded-2xl p-4 flex items-start gap-3">
                  <Receipt size={18} className="text-[#78ad44] mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-gray-900">Giao dịch gần nhất</p>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      {latestPayment.gateway} - {PAYMENT_STATUS_META[latestPayment.status].label}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate(`/booking/${booking.id}/result`)}
                  className="w-full bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Xem kết quả booking
                </button>
                <button
                  onClick={() => navigate(`/my-bookings/${booking.id}`)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl py-4 transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Xem chi tiết booking
                </button>
                <Link
                  to="/my-bookings"
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl py-4 transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Đến danh sách booking
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function getErrorMessage(error: unknown) {
  const responseData = (error as { response?: { data?: Record<string, string> } }).response?.data;
  return responseData?.error
    ?? Object.values(responseData ?? {})[0]
    ?? 'Không thể xử lý thanh toán';
}

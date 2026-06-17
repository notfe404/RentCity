import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import BookingStepper from '@/components/booking/BookingStepper';
import PaymentHoldCountdown from '@/components/booking/PaymentHoldCountdown';
import { usePaymentHoldCountdown } from '@/hooks/usePaymentHoldCountdown';
import { getMyBooking } from '@/services/bookingApi';
import { completeVnpayMockCallback, createDepositPayment } from '@/services/paymentApi';
import { DEPOSIT_STATUS_META, getBookingVehicleImage, getBookingVehicleName } from '@/utils/bookingMapper';
import { formatDateTime, formatVND } from '@/utils/formatters';
import { generateVNPayQRCode } from '@/utils/qrCodeGenerator';
import { parsePaymentError } from '@/utils/paymentErrorHandler';
import type { ApiBookingResponse } from '@/types';

export default function VNPayQR() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'qr_display' | 'processing' | 'success' | 'error'>('loading');
  const [qrImage, setQrImage] = useState('');
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [gatewayReference, setGatewayReference] = useState('');
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState(0);
  const { remainingSeconds, expired: paymentExpired } = usePaymentHoldCountdown(
    booking?.paymentExpiresAt,
    booking?.status === 'PENDING',
  );

  useEffect(() => {
    let mounted = true;

    const initPayment = async () => {
      if (!id) {
        setStatus('error');
        setErrorMessage('Booking không tồn tại');
        return;
      }

      try {
        const { data: bookingData } = await getMyBooking(id);
        if (!mounted) {
          return;
        }

        setBooking(bookingData);

        const { data: createdPayment } = await createDepositPayment({
          bookingId: parseInt(id, 10),
          gateway: 'VNPAY',
        });

        if (!mounted) {
          return;
        }

        const qr = generateVNPayQRCode(createdPayment.amount, bookingData.bookingCode);
        setQrImage(qr);
        setGatewayReference(createdPayment.gatewayReference);
        setStatus('qr_display');
      } catch (error) {
        if (mounted) {
          const paymentError = parsePaymentError(error);
          setStatus('error');
          setErrorMessage(paymentError.userMessage);
          toast.error(paymentError.userMessage);
        }
      }
    };

    void initPayment();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (status !== 'qr_display') {
      return;
    }

    let countdown = 15;
    setAutoConfirmCountdown(countdown);

    const timer = setInterval(() => {
      countdown -= 1;
      setAutoConfirmCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== 'qr_display' || !gatewayReference) {
      return;
    }

    const timer = setTimeout(() => {
      void simulateQRScan(gatewayReference);
    }, 15000);

    return () => clearTimeout(timer);
  }, [status, gatewayReference]);

  const simulateQRScan = async (reference: string) => {
    if (!reference || status === 'processing' || status === 'success') {
      return;
    }

    setStatus('processing');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { data: result } = await completeVnpayMockCallback(reference);

      if (result.status !== 'PAID') {
        throw new Error('Thanh toán chưa hoàn tất');
      }

      setStatus('success');
      if (id) {
        await getMyBooking(id);
      }

      setTimeout(() => {
        navigate(`/booking/${id}/result`);
      }, 1500);
    } catch (error) {
      const paymentError = parsePaymentError(error);
      setStatus('error');
      setErrorMessage(paymentError.userMessage);
      toast.error(paymentError.userMessage);
    }
  };

  const handleManualConfirm = () => {
    if (gatewayReference && status === 'qr_display') {
      void simulateQRScan(gatewayReference);
    }
  };

  const depositMeta = booking ? DEPOSIT_STATUS_META[booking.depositStatus] : null;
  const vehicleImage = useMemo(() => (booking ? getBookingVehicleImage(booking) : undefined), [booking]);
  const vehicleName = useMemo(() => (booking ? getBookingVehicleName(booking) : 'Booking'), [booking]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        <BookingStepper currentStep={3} />

        <div className="mb-8">
          <button
            onClick={() => navigate(`/booking/${id}/payment`)}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} /> Quay lại chọn thanh toán
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10">
          <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f1ff] flex items-center justify-center text-blue-600 shrink-0">
                <QrCode size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Thanh toán VNPay</h1>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  Quét mã QR ngay trong giao diện RentCity để hoàn tất thanh toán cọc cho booking
                  {booking && <span className="font-black text-gray-900"> {booking.bookingCode}</span>}.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <PaymentHoldCountdown
                remainingSeconds={remainingSeconds}
                expired={paymentExpired}
              />
            </div>

            {status === 'loading' && (
              <div className="rounded-[1.75rem] border border-gray-100 bg-[#f4f8f7] p-12 text-center">
                <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-black text-gray-900">Đang tạo mã QR...</h2>
                <p className="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
              </div>
            )}

            {status === 'qr_display' && (
              <div className="space-y-8">
                <div className="rounded-[1.75rem] bg-gradient-to-br from-blue-50 via-white to-sky-50 border border-blue-100 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
                      {qrImage && (
                        <img
                          src={qrImage}
                          alt="VNPay QR Code"
                          className="w-full max-w-[280px] mx-auto rounded-xl"
                        />
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-3">Quét mã QR để thanh toán</h2>
                      <p className="text-sm text-gray-500 leading-relaxed mb-5">
                        Dùng ứng dụng ngân hàng hoặc VNPay trên điện thoại để quét mã. Hệ thống đang mô phỏng
                        xác nhận tự động sau vài giây.
                      </p>

                      {booking && (
                        <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-3">
                          <div className="flex justify-between gap-4 text-sm font-bold text-gray-600">
                            <span>Số tiền cần thanh toán</span>
                            <span className="text-blue-600">{formatVND(booking.depositAmount)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-sm font-bold text-gray-600">
                            <span>Mã booking</span>
                            <span className="text-gray-900">{booking.bookingCode}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-sm font-bold text-gray-600">
                            <span>Tự động xác nhận sau</span>
                            <span className="text-gray-900">{autoConfirmCountdown}s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleManualConfirm}
                    disabled={status !== 'qr_display' || paymentExpired}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors disabled:bg-gray-300"
                  >
                    Xác nhận thanh toán
                  </button>
                  <button
                    onClick={() => navigate(`/booking/${id}/payment`)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl transition-colors border-2 border-gray-200"
                  >
                    Đổi phương thức khác
                  </button>
                </div>

                
              </div>
            )}

            {status === 'processing' && (
              <div className="rounded-[1.75rem] border border-gray-100 bg-[#f4f8f7] p-12 text-center">
                <Loader2 size={48} className="text-purple-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-black text-gray-900">Đang xử lý thanh toán...</h2>
                <p className="text-sm text-gray-500 mt-2">Vui lòng chờ, hệ thống đang xác nhận giao dịch VNPay</p>
              </div>
            )}

            {status === 'success' && (
              <div className="rounded-[1.75rem] border border-green-100 bg-green-50 p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Thanh toán thành công</h2>
                <p className="text-sm text-gray-500 mt-2">Giao dịch đã được xác nhận. Đang chuyển hướng về kết quả booking...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Receipt size={40} className="text-red-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Thanh toán thất bại</h2>
                <p className="text-sm text-gray-600 font-medium mt-2">{errorMessage}</p>
                <button
                  onClick={() => navigate(`/booking/${id}/payment`)}
                  className="mt-6 w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors"
                >
                  Quay lại thanh toán
                </button>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 px-2 mb-6">Tóm tắt booking</h3>

              {booking && (
                <>
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
                      <span className="text-blue-600">{formatVND(booking.depositAmount)}</span>
                    </div>
                    {depositMeta && (
                      <div className="flex justify-between">
                        <span>Trạng thái cọc</span>
                        <span className={depositMeta.color}>{depositMeta.label}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate(`/booking/${id}/payment`)}
                  className="w-full bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} /> Quay lại trang thanh toán
                </button>
                <Link
                  to={`/my-bookings/${id}`}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl py-4 transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <Receipt size={18} /> Xem chi tiết booking
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eef5ff] text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">Thanh toán trong giao diện web</h4>
                  <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
                    Mã QR VNPay giờ được hiển thị ngay trong giao diện RentCity thay vì một màn hình tách rời kiểu standalone.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

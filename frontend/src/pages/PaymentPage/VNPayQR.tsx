import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, QrCode } from 'lucide-react';
import { completeVnpayMockCallback, createDepositPayment } from '@/services/paymentApi';
import { toast } from 'sonner';
import { getMyBooking } from '@/services/bookingApi';
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

  useEffect(() => {
    let mounted = true;

    const initPayment = async () => {
      if (!id) {
        setStatus('error');
        setErrorMessage('Booking không tồn tại');
        return;
      }

      try {
        // Get booking info
        const { data: bookingData } = await getMyBooking(id);
        if (!mounted) return;

        setBooking(bookingData);

        // Create deposit payment
        const { data: createdPayment } = await createDepositPayment({
          bookingId: parseInt(id),
          gateway: 'VNPAY',
        });

        if (!mounted) return;

        // Generate QR code
        const qr = generateVNPayQRCode(createdPayment.amount, bookingData.bookingCode);
        setQrImage(qr);
        setGatewayReference(createdPayment.gatewayReference);
        setStatus('qr_display');

        // Auto-confirm after 3 seconds (simulate scanning)
        const timer = setTimeout(() => {
          if (mounted) {
            simulateQRScan(createdPayment.gatewayReference);
          }
        }, 3000);

        return () => clearTimeout(timer);
      } catch (error) {
        if (mounted) {
          const paymentError = parsePaymentError(error);
          setStatus('error');
          setErrorMessage(paymentError.userMessage);
          toast.error(paymentError.userMessage);
        }
      }
    };

    initPayment();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Countdown timer for auto-confirm
  useEffect(() => {
    if (status !== 'qr_display') return;

    let countdown = 3;
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

  const simulateQRScan = async (reference: string) => {
    if (status !== 'qr_display') return;

    setStatus('processing');

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Call VNPay mock callback
      const { data: result } = await completeVnpayMockCallback(reference);

      if (result.status === 'PAID') {
        setStatus('success');

        // Refresh booking
        if (id) {
          await getMyBooking(id);
        }

        // Redirect after showing success
        setTimeout(() => {
          navigate(`/booking/${id}/result`);
        }, 1500);
      } else {
        throw new Error('Thanh toán chưa hoàn tất');
      }
    } catch (error) {
      const paymentError = parsePaymentError(error);
      setStatus('error');
      setErrorMessage(paymentError.userMessage);
      toast.error(paymentError.userMessage);
    }
  };

  const handleManualConfirm = () => {
    if (gatewayReference && status === 'qr_display') {
      simulateQRScan(gatewayReference);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* VNPay Logo Area */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6 p-4 bg-white rounded-full shadow-lg">
            <QrCode size={64} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">VNPay</h1>
          <p className="text-gray-500 font-medium">Quét mã QR để thanh toán</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 size={48} className="text-blue-600 animate-spin mx-auto" />
              <h2 className="text-xl font-black text-gray-900">Đang tạo mã QR...</h2>
              <p className="text-sm text-gray-500">Vui lòng chờ một lát</p>
            </div>
          )}

          {status === 'qr_display' && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 inline-block w-full">
                {qrImage && (
                  <img
                    src={qrImage}
                    alt="VNPay QR Code"
                    className="w-full max-w-xs mx-auto rounded-xl shadow-lg border-4 border-white"
                  />
                )}
              </div>

              <div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Quét mã QR để thanh toán</h2>
                <p className="text-sm text-gray-500 mb-4">Dùng ứng dụng ngân hàng hoặc VNPay để quét mã</p>

                {booking && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
                    <p className="text-gray-700">
                      Số tiền: <span className="font-black text-blue-600">{booking.depositAmount?.toLocaleString()} VND</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Booking: {booking.bookingCode}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500 font-medium">
                  <p>Thanh toán sẽ được xác nhận trong {autoConfirmCountdown}s...</p>
                </div>
              </div>

              <button
                onClick={handleManualConfirm}
                disabled={status !== 'qr_display'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors disabled:bg-gray-300"
              >
                Xác nhận thanh toán
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center space-y-4">
              <Loader2 size={48} className="text-purple-600 animate-spin mx-auto" />
              <h2 className="text-xl font-black text-gray-900">Đang xử lý thanh toán...</h2>
              <p className="text-sm text-gray-500">Vui lòng chờ, đang xác nhận giao dịch VNPay</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 size={48} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-900">Thanh toán thành công!</h2>
              <p className="text-sm text-gray-500">Giao dịch của bạn đã được xác nhận. Đang chuyển hướng...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-600">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-900">Thanh toán thất bại</h2>
              <p className="text-sm text-gray-600 font-medium">{errorMessage}</p>
              <button
                onClick={() => navigate(`/booking/${id}/payment`)}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors"
              >
                Quay lại thanh toán
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {status === 'qr_display' && (
          <div className="mt-6 text-center text-xs text-gray-500 font-medium">
            <p>✓ Thanh toán an toàn qua VNPay</p>
            <p className="mt-1">Bạn sẽ được chuyển hướng sau khi xác nhận</p>
          </div>
        )}
      </div>
    </div>
  );
}

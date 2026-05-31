import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { capturePaypalPayment, createDepositPayment } from '@/services/paymentApi';
import { toast } from 'sonner';
import { getMyBooking } from '@/services/bookingApi';
import { parsePaymentError } from '@/utils/paymentErrorHandler';

export default function PayPalRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'redirecting' | 'processing' | 'success' | 'error'>('redirecting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const processPayment = async () => {
      if (!id) {
        setStatus('error');
        setErrorMessage('Booking không tồn tại');
        return;
      }

      try {
        // Step 1: Create deposit payment
        const { data: createdPayment } = await createDepositPayment({
          bookingId: parseInt(id),
          gateway: 'PAYPAL',
        });

        if (!mounted) return;

        // Step 2: Simulate PayPal processing
        setStatus('processing');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!mounted) return;

        // Step 3: Capture payment (complete transaction)
        const { data: capturedPayment } = await capturePaypalPayment(createdPayment.id);

        if (!mounted) return;

        if (capturedPayment.status === 'PAID') {
          setStatus('success');

          // Refresh booking info
          await getMyBooking(id);

          // Redirect after showing success
          setTimeout(() => {
            navigate(`/booking/${id}/result`);
          }, 1500);
        } else {
          throw new Error('Thanh toán chưa hoàn tất');
        }
      } catch (error) {
        if (mounted) {
          const paymentError = parsePaymentError(error);
          setStatus('error');
          setErrorMessage(paymentError.userMessage);
          toast.error(paymentError.userMessage);
        }
      }
    };

    processPayment();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* PayPal Logo Area */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6 p-4 bg-white rounded-full shadow-lg">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#003087">
                ₰
              </text>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">PayPal</h1>
          <p className="text-gray-500 font-medium">Thanh toán an toàn qua PayPal</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {status === 'redirecting' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Đang chuyển hướng...</h2>
              <p className="text-sm text-gray-500">Vui lòng chờ, bạn sẽ được chuyển đến trang thanh toán PayPal</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Đang xử lý thanh toán...</h2>
              <p className="text-sm text-gray-500">Vui lòng không đóng trang này, đang kiểm tra giao dịch</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
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
            <div className="space-y-4">
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            ✓ Giao dịch được bảo vệ bởi PayPal Buyer Protection
          </p>
        </div>
      </div>
    </div>
  );
}

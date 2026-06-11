import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
    // Dynamically load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => {
      initializePayPal();
    };
    script.onerror = () => {
      toast.error('Failed to load PayPal SDK');
      setStatus('error');
      setErrorMessage('Không thể tải PayPal SDK');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializePayPal = async () => {
    if (!id) {
      setStatus('error');
      setErrorMessage('Booking không tồn tại');
      return;
    }

    try {
      // Create deposit payment in backend
      const { data: createdPayment } = await createDepositPayment({
        bookingId: parseInt(id),
        gateway: 'PAYPAL',
      });

      setStatus('processing');

      // Initialize PayPal Buttons
      // Initialize PayPal Buttons with a slight delay so React can render the container
      setTimeout(() => {
        if ((window as any).paypal) {
            
          const container = document.getElementById('paypal-button-container');
          if (container) container.innerHTML = '';

          (window as any).paypal.Buttons({
            createOrder: async (_data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [
                  {
                    description: `Thanh toán cọc cho Booking: ${id}`,
                    amount: {
                      currency_code: "USD",
                      value: "100.00" 
                    }
                  }
                ]
              });
            },
            onApprove: async (_data: any, _actions: any) => {
              try {
                // Capture payment after user approves
                const { data: capturedPayment } = await capturePaypalPayment(createdPayment.id);

                if (capturedPayment.status === 'PAID') {
                  setStatus('success');
                  
                  // Refresh booking info
                  await getMyBooking(id);

                  // Redirect after showing success
                  setTimeout(() => {
                    navigate(`/booking/${id}/result`);
                  }, 2000);
                } else {
                  throw new Error('Payment not completed');
                }
              } catch (error) {
                const paymentError = parsePaymentError(error);
                setStatus('error');
                setErrorMessage(paymentError.userMessage);
                toast.error(paymentError.userMessage);
              }
            },
            onError: (err: any) => {
              setStatus('error');
              setErrorMessage(`PayPal Error: ${err}`);
              toast.error(`PayPal Error: ${err}`);
            },
          }).render('#paypal-button-container');
        }
      }, 150); // 150ms delay
    } catch (error) {
      const paymentError = parsePaymentError(error);
      setStatus('error');
      setErrorMessage(paymentError.userMessage);
      toast.error(paymentError.userMessage);
    }
  };

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
              <h2 className="text-xl font-black text-gray-900">Đang tải...</h2>
              <p className="text-sm text-gray-500">Vui lòng chờ, đang khởi động PayPal</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Chọn phương thức thanh toán</h2>
              <div id="paypal-button-container" className="bg-gray-50 rounded-xl p-4 min-h-[150px]"></div>
              <p className="text-xs text-gray-400 italic">
                Bạn sẽ được chuyển hướng đến PayPal để hoàn tất thanh toán
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 size={64} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Thanh toán thành công!</h2>
              <p className="text-gray-600">Đơn đặt xe của bạn đã được xác nhận. Đang chuyển hướng...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertCircle size={64} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Thanh toán thất bại</h2>
              <p className="text-sm text-red-600">{errorMessage}</p>
              <button
                onClick={() => navigate(`/booking/${id}`)}
                className="w-full mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Quay lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

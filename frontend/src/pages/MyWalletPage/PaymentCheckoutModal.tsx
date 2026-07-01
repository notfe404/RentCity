import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';

import { capturePaypalPayment, completeVnpayMockCallback } from '@/services/paymentApi';
import type { ApiPaymentResponse } from '@/types';
import { formatVND } from '@/utils/formatters';
import { generateVNPayQRCode } from '@/utils/qrCodeGenerator';

type CheckoutStatus = 'ready' | 'processing' | 'success' | 'error';

interface PaymentCheckoutModalProps {
  payment: ApiPaymentResponse;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentCheckoutModal({ payment, onClose, onSuccess }: PaymentCheckoutModalProps) {
  const [status, setStatus] = useState<CheckoutStatus>('ready');
  const [error, setError] = useState('');

  const qrImage = useMemo(() => {
    if (payment.gateway !== 'VNPAY') return '';
    return generateVNPayQRCode(
      payment.amount,
      payment.bookingCode ?? `WALLET-${payment.id}`,
    );
  }, [payment]);

  useEffect(() => {
    if (status !== 'ready' || payment.gateway !== 'PAYPAL') return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-rentcity-paypal]');
    if (existing || (window as any).paypal) {
      renderPaypal();
      return;
    }
    const script = document.createElement('script');
    script.dataset.rentcityPaypal = 'true';
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'}&currency=USD`;
    script.async = true;
    script.onload = renderPaypal;
    script.onerror = () => {
      setStatus('error');
      setError('Could not load PayPal');
    };
    document.body.appendChild(script);
  }, [payment, status]);

  const renderPaypal = () => {
    if (!(window as any).paypal) return;
    window.setTimeout(() => {
      const container = document.getElementById('wallet-paypal-buttons');
      if (!container) return;
      container.innerHTML = '';
      (window as any).paypal.Buttons({
        createOrder: (_data: unknown, actions: any) => actions.order.create({
          purchase_units: [{
            description: payment.type === 'DAMAGE_PAYMENT'
              ? `Damage payment for ${payment.bookingCode}`
              : 'RentCity wallet top-up',
            amount: { currency_code: 'USD', value: Math.max(1, payment.amount / 25000).toFixed(2) },
          }],
        }),
        onApprove: () => completePaypal(),
        onError: () => {
          setStatus('error');
          setError('PayPal payment failed');
        },
      }).render('#wallet-paypal-buttons');
    }, 100);
  };

  const completePaypal = async () => {
    setStatus('processing');
    try {
      const { data } = await capturePaypalPayment(payment.id);
      finish(data);
    } catch {
      setStatus('error');
      setError('PayPal payment could not be confirmed');
    }
  };

  const completeVnpay = async () => {
    setStatus('processing');
    try {
      const { data } = await completeVnpayMockCallback(payment.gatewayReference);
      finish(data);
    } catch {
      setStatus('error');
      setError('VNPay payment could not be confirmed');
    }
  };

  const finish = (result: ApiPaymentResponse) => {
    if (result.status !== 'PAID') {
      setStatus('error');
      setError('Payment is not complete');
      return;
    }
    setStatus('success');
    toast.success(result.type === 'DAMAGE_PAYMENT' ? 'Damage request paid' : 'Wallet top-up completed');
    window.setTimeout(() => {
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={status === 'processing'}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {status === 'error' && <Centered icon={<CreditCard className="text-red-500" size={48} />} title="Payment failed" text={error} />}
          {status === 'processing' && <Centered icon={<Loader2 className="animate-spin text-blue-600" size={48} />} title="Confirming payment..." />}
          {status === 'success' && <Centered icon={<CheckCircle2 className="text-green-600" size={52} />} title="Payment successful" text="Your wallet has been updated." />}

          {status === 'ready' && (
            <div>
              <div className="text-center mb-8 mt-4">
                <h2 className="text-2xl font-black text-gray-900">
                  {payment.type === 'DAMAGE_PAYMENT' ? 'Pay damage request' : 'Top up My Wallet'}
                </h2>
                <p className="mt-2 text-sm text-gray-500 font-medium">
                  Complete payment through {payment.gateway}.
                </p>
                <p className="mt-4 text-3xl font-black text-[#78ad44]">{formatVND(payment.amount)}</p>
              </div>

              {payment.gateway === 'VNPAY' ? (
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-center">
                  <QrCode className="mx-auto text-blue-600 mb-3" />
                  <img src={qrImage} alt="VNPay QR code" className="w-48 max-w-full mx-auto bg-white rounded-2xl p-4 shadow-sm" />
                  <p className="text-xs text-gray-500 mt-4">Scan the QR code, then confirm the payment.</p>
                  <button onClick={completeVnpay} className="mt-5 w-full py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors">
                    Confirm VNPay payment
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                  <div id="wallet-paypal-buttons" className="min-h-32" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Centered({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-black text-gray-900">{title}</h3>
      {text && <p className="text-sm text-gray-500 mt-2">{text}</p>}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, CreditCard, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { getMyPayments, downloadBookingInvoicePdf } from '@/services/paymentApi';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type { ApiPaymentResponse, PaymentStatus } from '@/types';

const STATUS_META: Record<PaymentStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: 'text-orange-600', icon: '⏱️' },
  PAID: { label: 'Đã thanh toán', color: 'text-green-600', icon: '✓' },
  FAILED: { label: 'Thất bại', color: 'text-red-600', icon: '✗' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-blue-600', icon: '↶' },
  EXPIRED: { label: 'Hết hạn', color: 'text-gray-600', icon: '⌛' },
};

const GATEWAY_COLORS: Record<string, string> = {
  PAYPAL: 'bg-blue-100 text-blue-700',
  VNPAY: 'bg-indigo-100 text-indigo-700',
};

export default function TransactionsTab() {
  const [payments, setPayments] = useState<ApiPaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | PaymentStatus>('ALL');
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await getMyPayments();
        setPayments(data);
      } catch (error) {
        toast.error('Không tải được lịch sử thanh toán');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (filterStatus === 'ALL') {
      return payments.slice(0, 5); // Show only latest 5
    }
    return payments.filter((p) => p.status === filterStatus).slice(0, 5);
  }, [payments, filterStatus]);

  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const handleDownloadInvoice = async (bookingId: number, bookingCode: string) => {
    setIsDownloading(bookingId);
    try {
      const { data: blob } = await downloadBookingInvoicePdf(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${bookingCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tải hoá đơn thành công');
    } catch (error) {
      toast.error('Lỗi khi tải hoá đơn');
    } finally {
      setIsDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-[#78ad44]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <p className="text-sm font-bold text-green-600 mb-1">Tổng đã thanh toán</p>
          <p className="text-3xl font-black text-green-700">{formatVND(totalPaid)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <p className="text-sm font-bold text-blue-600 mb-1">Tổng giao dịch</p>
          <p className="text-3xl font-black text-blue-700">{payments.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
            filterStatus === 'ALL'
              ? 'bg-[#78ad44] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        {Object.entries(STATUS_META).map(([status, meta]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as PaymentStatus)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              filterStatus === status
                ? 'bg-[#78ad44] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {meta.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">Không có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const statusMeta = STATUS_META[payment.status];
            const gatewayColor = GATEWAY_COLORS[payment.gateway] || 'bg-gray-100 text-gray-700';

            return (
              <div
                key={payment.id}
                className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="text-2xl shrink-0">{statusMeta.icon}</div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-gray-900 truncate">
                        {payment.bookingCode}
                      </p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${gatewayColor}`}>
                        {payment.gateway}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDateTime(payment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-black text-lg text-[#78ad44]">{formatVND(payment.amount)}</p>
                    <p className={`text-xs font-bold ${statusMeta.color}`}>{statusMeta.label}</p>
                  </div>

                  {/* Download Button */}
                  {payment.status === 'PAID' && (
                    <button
                      onClick={() => handleDownloadInvoice(payment.bookingId, payment.bookingCode ?? String(payment.bookingId))}
                      disabled={isDownloading === payment.bookingId}
                      className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                      title="Tải hoá đơn"
                    >
                      {isDownloading === payment.bookingId ? (
                        <Loader2 size={18} className="animate-spin text-gray-600" />
                      ) : (
                        <Download size={18} className="text-gray-600 hover:text-[#78ad44]" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {payments.length > 5 && (
        <div className="text-center">
          <a
            href="/payments"
            className="text-[#78ad44] font-bold hover:text-[#689938] transition-colors inline-flex items-center gap-2"
          >
            Xem tất cả giao dịch
            <Eye size={16} />
          </a>
        </div>
      )}
    </div>
  );
}

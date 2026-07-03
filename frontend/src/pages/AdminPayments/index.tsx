import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Search, CreditCard, Loader2, DollarSign, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminGetPayments, type ApiAdminPayment } from '@/services/adminApi';
import { formatDateTime, formatVND } from '@/utils/formatters';

type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  PAID: { label: 'Paid', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  FAILED: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
  REFUNDED: { label: 'Refunded', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' },
};

const GATEWAY_LABEL: Record<string, string> = {
  PAYPAL: 'PayPal',
  VNPAY: 'VNPay',
  CASH: 'Cash',
  WALLET: 'Refund balance',
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REFUNDED', label: 'Refunded' },
  { key: 'FAILED', label: 'Failed' },
];

const REVENUE_PAYMENT_TYPES = new Set(['DEPOSIT', 'FINAL_RENTAL_PAYMENT', 'BALANCE_PAYMENT', 'FULL']);

function paymentTypeLabel(type: string) {
  switch (type) {
    case 'DEPOSIT':
      return 'Reservation Fee';
    case 'SECURITY_DEPOSIT':
      return 'Vehicle Security Deposit';
    case 'SECURITY_DEPOSIT_REFUND':
      return 'Security Deposit Refund';
    case 'FINAL_RENTAL_PAYMENT':
      return 'Final Rental Payment';
    case 'DAMAGE_PAYMENT':
      return 'Damage Payment';
    case 'BALANCE_PAYMENT':
      return 'Balance Payment';
    case 'WALLET_TOP_UP':
      return 'Wallet Top-up';
    case 'FULL':
      return 'Full Payment';
    case 'REFUND':
      return 'Refund';
    default:
      return type.replaceAll('_', ' ');
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<ApiAdminPayment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<ApiAdminPayment | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await adminGetPayments();
        if (!cancelled) setPayments(data);
      } catch {
        if (!cancelled) toast.error('Could not load payments');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (kw) {
        return (
          (p.bookingCode || '').toLowerCase().includes(kw) ||
          (p.customerName || '').toLowerCase().includes(kw) ||
          (p.customerEmail || '').toLowerCase().includes(kw) ||
          p.id.toString().includes(kw)
        );
      }
      return true;
    });
  }, [payments, search, statusFilter]);

  const totalPaid = useMemo(
    () => filtered
      .filter((p) => p.status === 'PAID' && REVENUE_PAYMENT_TYPES.has(p.type))
      .reduce((s, p) => s + p.amount, 0),
    [filtered],
  );

  return (
    <AdminLayout title="Payment Management">
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Transactions', value: payments.length, color: 'text-gray-900' },
          { label: 'Revenue (visible)', value: formatVND(totalPaid), color: 'text-[#78ad44]' },
          { label: 'Pending', value: payments.filter((p) => p.status === 'PENDING').length, color: 'text-orange-600' },
          { label: 'Refunded', value: payments.filter((p) => p.status === 'REFUNDED').length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <DollarSign size={20} className="mb-3 text-gray-400" />
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs font-bold text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Booking code, customer, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm font-medium focus:border-[#78ad44] focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20"
          />
        </div>
        <div className="flex overflow-x-auto rounded-xl bg-[#f4f8f7] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                statusFilter === f.key ? 'border border-gray-200 bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f4f8f7]">
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Transactions</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Booking</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Customer</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Method</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Amount</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Status</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-gray-400">Date</th>
                <th className="p-5 text-right text-xs font-black uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <Loader2 className="mx-auto animate-spin text-[#78ad44]" size={28} />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center font-bold text-gray-400">
                    <CreditCard className="mx-auto mb-3 text-gray-300" size={36} />
                    No matching transactions found
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((p) => {
                const meta = STATUS_META[p.status] ?? { label: p.status, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' };
                return (
                  <tr key={p.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="p-5">
                      <p className="text-sm font-black text-gray-900">#{p.id}</p>
                      <p className="text-xs font-bold text-gray-400">{paymentTypeLabel(p.type)}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">{p.bookingCode || `#${p.bookingId}`}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">{p.customerName || `Customer #${p.userId}`}</p>
                      <p className="text-xs text-gray-400">{p.customerEmail || 'No email available'}</p>
                    </td>
                    <td className="p-5">
                      <span className="text-sm font-bold text-gray-700">{GATEWAY_LABEL[p.gateway] ?? p.gateway}</span>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-black text-[#78ad44]">{formatVND(p.amount)}</p>
                    </td>
                    <td className="p-5">
                      <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-5 text-xs font-bold text-gray-500">{formatDateTime(p.createdAt)}</td>
                    <td className="p-5 text-right">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400">Showing {filtered.length} / {payments.length} transactions</p>
        </div>
      </div>

      {selectedPayment && (
        <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </AdminLayout>
  );
}

function PaymentDetailModal({
  payment,
  onClose,
}: {
  payment: ApiAdminPayment;
  onClose: () => void;
}) {
  const meta = STATUS_META[payment.status] ?? { label: payment.status, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#f4f8f7] px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400">Payment detail</p>
            <h2 className="mt-1 text-xl font-black text-gray-900">Transaction #{payment.id}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-900"
            aria-label="Close payment details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <Detail label="Transaction type" value={paymentTypeLabel(payment.type)} />
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">Status</p>
            <span className={`mt-2 inline-flex rounded-lg border px-3 py-1 text-xs font-bold ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <Detail label="Amount" value={formatVND(payment.amount)} strong />
          <Detail label="Method" value={GATEWAY_LABEL[payment.gateway] ?? payment.gateway} />
          <Detail label="Booking" value={payment.bookingCode || `#${payment.bookingId}`} />
          <Detail label="Customer" value={payment.customerName || `Customer #${payment.userId}`} subValue={payment.customerEmail || 'No email available'} />
          <Detail label="Gateway reference" value={payment.gatewayReference || '-'} />
          <Detail label="Gateway transaction ID" value={payment.gatewayTransactionId || '-'} />
          <Detail label="Created at" value={formatDateTime(payment.createdAt)} />
          <Detail label="Paid at" value={payment.paidAt ? formatDateTime(payment.paidAt) : '-'} />
          <Detail label="Refunded at" value={payment.refundedAt ? formatDateTime(payment.refundedAt) : '-'} />
          <Detail label="Failure reason" value={payment.failureReason || '-'} />
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  subValue,
  strong = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-2 break-words text-sm ${strong ? 'font-black text-[#78ad44]' : 'font-bold text-gray-900'}`}>{value}</p>
      {subValue && <p className="mt-1 break-words text-xs font-medium text-gray-400">{subValue}</p>}
    </div>
  );
}

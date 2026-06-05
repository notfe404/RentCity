import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Search, CreditCard, Loader2, RotateCcw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { adminGetPayments, adminRefundPayment, type ApiAdminPayment } from '@/services/adminApi';
import { formatDateTime, formatVND } from '@/utils/formatters';

type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Chờ TT',    color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  PAID:     { label: 'Đã TT',     color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
  FAILED:   { label: 'Thất bại',  color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
  REFUNDED: { label: 'Hoàn tiền', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
  EXPIRED:  { label: 'Hết hạn',   color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-100' },
};

const GATEWAY_LABEL: Record<string, string> = {
  PAYPAL: 'PayPal',
  VNPAY: 'VNPay',
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PAID', label: 'Đã TT' },
  { key: 'PENDING', label: 'Chờ TT' },
  { key: 'REFUNDED', label: 'Hoàn tiền' },
  { key: 'FAILED', label: 'Thất bại' },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<ApiAdminPayment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await adminGetPayments();
        if (!cancelled) setPayments(data);
      } catch {
        if (!cancelled) toast.error('Không tải được danh sách thanh toán');
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
    () => filtered.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    [filtered],
  );

  const handleRefund = async (payment: ApiAdminPayment) => {
    setActiveId(payment.id);
    try {
      const { data } = await adminRefundPayment(payment.id);
      setPayments((cur) => cur.map((p) => (p.id === payment.id ? data : p)));
      toast.success(`Đã hoàn tiền cho giao dịch #${payment.id}`);
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Không thể hoàn tiền';
      toast.error(msg);
    } finally {
      setActiveId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý thanh toán">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng giao dịch', value: payments.length, color: 'text-gray-900' },
          { label: 'Doanh thu (hiển thị)', value: formatVND(totalPaid), color: 'text-[#78ad44]' },
          { label: 'Chờ xử lý', value: payments.filter((p) => p.status === 'PENDING').length, color: 'text-orange-600' },
          { label: 'Hoàn tiền', value: payments.filter((p) => p.status === 'REFUNDED').length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <DollarSign size={20} className="mb-3 text-gray-400" />
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Mã booking, khách hàng, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44]"
          />
        </div>
        <div className="flex bg-[#f4f8f7] p-1 rounded-xl overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                statusFilter === f.key ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f4f8f7] border-b border-gray-100">
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Giao dịch</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Booking</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Khách hàng</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Phương thức</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Số tiền</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Ngày</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#78ad44]" size={28} />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-400 font-bold">
                    <CreditCard className="mx-auto mb-3 text-gray-300" size={36} />
                    Không tìm thấy giao dịch phù hợp
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((p) => {
                const meta = STATUS_META[p.status] ?? { label: p.status, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' };
                const busy = activeId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-5">
                      <p className="font-black text-gray-900 text-sm">#{p.id}</p>
                      <p className="text-xs text-gray-400 font-bold">{p.type}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-900 text-sm">{p.bookingCode || `#${p.bookingId}`}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-900 text-sm">{p.customerName || '—'}</p>
                      <p className="text-xs text-gray-400">{p.customerEmail || '—'}</p>
                    </td>
                    <td className="p-5">
                      <span className="text-sm font-bold text-gray-700">{GATEWAY_LABEL[p.gateway] ?? p.gateway}</span>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-[#78ad44] text-sm">{formatVND(p.amount)}</p>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-5 text-xs font-bold text-gray-500">{formatDateTime(p.createdAt)}</td>
                    <td className="p-5 text-right">
                      {p.status === 'PAID' && (
                        <button
                          disabled={busy}
                          onClick={() => handleRefund(p)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                          Hoàn tiền
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400">Hiển thị {filtered.length} / {payments.length} giao dịch</p>
        </div>
      </div>
    </AdminLayout>
  );
}

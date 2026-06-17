import { useEffect, useMemo, useState } from 'react';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import {
  Calendar,
  CreditCard,
  Download,
  Filter,
  Search,
  Eye,
  ChevronDown,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getMyPayments, downloadBookingInvoicePdf } from '@/services/paymentApi';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type { ApiPaymentResponse, PaymentStatus, PaymentGateway } from '@/types';

type FilterStatus = PaymentStatus | 'ALL';
type FilterGateway = PaymentGateway | 'ALL';

interface PaymentFilter {
  status: FilterStatus;
  gateway: FilterGateway;
  searchTerm: string;
  startDate: string;
  endDate: string;
}

const STATUS_META: Record<PaymentStatus, { label: string; color: string; icon: string; bgColor: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: 'text-orange-600', icon: '⏱️', bgColor: 'bg-orange-50' },
  PAID: { label: 'Đã thanh toán', color: 'text-green-600', icon: '✓', bgColor: 'bg-green-50' },
  FAILED: { label: 'Thất bại', color: 'text-red-600', icon: '✗', bgColor: 'bg-red-50' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-blue-600', icon: '↶', bgColor: 'bg-blue-50' },
  EXPIRED: { label: 'Hết hạn', color: 'text-gray-600', icon: '⌛', bgColor: 'bg-gray-50' },
};

const GATEWAY_META: Record<PaymentGateway, { label: string; icon: string; color: string }> = {
  PAYPAL: { label: 'PayPal', icon: '🔵', color: '#003087' },
  VNPAY: { label: 'VNPay', icon: '💳', color: '#003087' },
  WALLET: { label: 'My Wallet', icon: 'W', color: '#78ad44' },
};

interface PaymentDetailsModalProps {
  payment: ApiPaymentResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadInvoice: (bookingId: number) => Promise<void>;
}

function PaymentDetailsModal({ payment, isOpen, onClose, onDownloadInvoice }: PaymentDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !payment) return null;

  const statusMeta = STATUS_META[payment.status];
  const gatewayMeta = GATEWAY_META[payment.gateway];

  const handleDownload = async () => {
    if (payment.bookingId == null) return;
    setIsDownloading(true);
    try {
      await onDownloadInvoice(payment.bookingId);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Chi tiết giao dịch</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`${statusMeta.bgColor} rounded-2xl p-4 flex items-center gap-3`}>
            <div className="text-2xl">{statusMeta.icon}</div>
            <div>
              <p className="text-xs font-bold text-gray-500">Trạng thái giao dịch</p>
              <p className={`text-lg font-black ${statusMeta.color}`}>{statusMeta.label}</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-500">Mã giao dịch</span>
              <span className="font-black text-gray-900">#{payment.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-500">Phương thức</span>
              <div className="flex items-center gap-2">
                <span>{gatewayMeta.icon}</span>
                <span className="font-black text-gray-900">{gatewayMeta.label}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-500">Loại thanh toán</span>
              <span className="font-black text-gray-900">{payment.type}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Amount */}
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-gray-500">Số tiền</span>
              <div className="text-right">
                <p className="text-2xl font-black text-[#78ad44]">{formatVND(payment.amount)}</p>
                <p className="text-xs font-bold text-gray-400">{payment.currency}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-500">Ngày tạo</span>
              <span className="font-medium text-gray-900">{formatDateTime(payment.createdAt)}</span>
            </div>

            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-500">Ngày thanh toán</span>
                <span className="font-medium text-gray-900">{formatDateTime(payment.paidAt)}</span>
              </div>
            )}

            {payment.refundedAt && (
              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-500">Ngày hoàn tiền</span>
                <span className="font-medium text-gray-900">{formatDateTime(payment.refundedAt)}</span>
              </div>
            )}
          </div>

          {/* Reference Info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            {payment.gatewayReference && (
              <>
                <p className="text-xs font-bold text-gray-500">Gateway Reference</p>
                <p className="text-xs font-mono text-gray-700 break-all">{payment.gatewayReference}</p>
              </>
            )}

            {payment.gatewayTransactionId && (
              <>
                <p className="text-xs font-bold text-gray-500 mt-3">Transaction ID</p>
                <p className="text-xs font-mono text-gray-700 break-all">{payment.gatewayTransactionId}</p>
              </>
            )}
          </div>

          {/* Failure Reason */}
          {payment.failureReason && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <p className="text-xs font-bold text-red-600">Lý do thất bại</p>
              <p className="text-sm text-red-700 mt-1">{payment.failureReason}</p>
            </div>
          )}

          {/* Booking Info */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500">Booking</p>
            <p className="text-sm font-black text-gray-900 mt-1">{payment.bookingCode}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {payment.bookingId != null && <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full bg-[#78ad44] hover:bg-[#689938] disabled:bg-gray-300 text-white font-bold rounded-2xl py-3 flex items-center justify-center gap-2 transition-colors"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Tải hoá đơn PDF
                </>
              )}
            </button>}
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-2xl py-3 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<ApiPaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<ApiPaymentResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fromPath = (location.state as { from?: unknown } | null)?.from;
  const returnTarget =
    typeof fromPath === 'string' && fromPath.startsWith('/my-bookings')
      ? { path: '/my-bookings', label: 'Quay lại My Bookings' }
      : { path: '/profile', label: 'Quay lại hồ sơ' };

  const [filters, setFilters] = useState<PaymentFilter>({
    status: 'ALL',
    gateway: 'ALL',
    searchTerm: '',
    startDate: '',
    endDate: '',
  });

  const [showFilters, setShowFilters] = useState(false);

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
    return payments.filter((payment) => {
      // Status filter
      if (filters.status !== 'ALL' && payment.status !== filters.status) {
        return false;
      }

      // Gateway filter
      if (filters.gateway !== 'ALL' && payment.gateway !== filters.gateway) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (
          !(payment.bookingCode ?? '').toLowerCase().includes(term) &&
          !payment.id.toString().includes(term)
        ) {
          return false;
        }
      }

      // Date range filter
      if (filters.startDate) {
        const paymentDate = new Date(payment.createdAt);
        const startDate = new Date(filters.startDate);
        if (paymentDate < startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const paymentDate = new Date(payment.createdAt);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (paymentDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [payments, filters]);

  const totalAmount = useMemo(() => {
    return filteredPayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const handleViewDetails = (payment: ApiPaymentResponse) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleDownloadInvoice = async (bookingId: number) => {
    try {
      const { data: blob } = await downloadBookingInvoicePdf(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tải hoá đơn thành công');
    } catch (error) {
      toast.error('Lỗi khi tải hoá đơn');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Lịch sử thanh toán</h1>
            <p className="text-gray-500 font-medium">Xem tất cả giao dịch thanh toán của bạn</p>
          </div>
          <button
            onClick={() => navigate(returnTarget.path)}
            className="self-start inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm border border-gray-100 hover:bg-[#f4f8f7] hover:text-[#78ad44] transition-colors"
          >
            <ArrowLeft size={16} />
            {returnTarget.label}
          </button>
        </div>

        {/* Summary Card */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm font-bold text-gray-500 mb-2">Tổng thanh toán</p>
              <p className="text-3xl font-black text-[#78ad44]">{formatVND(totalAmount)}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm font-bold text-gray-500 mb-2">Tổng giao dịch</p>
              <p className="text-3xl font-black text-gray-900">{filteredPayments.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm font-bold text-gray-500 mb-2">Đang chờ</p>
              <p className="text-3xl font-black text-orange-600">
                {filteredPayments.filter((p) => p.status === 'PENDING').length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Filter size={20} />
              Lọc giao dịch
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {showFilters ? 'Ẩn' : 'Hiện'}
              <ChevronDown size={18} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Mã booking hoặc ID"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44]"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as FilterStatus })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44]"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">Chờ thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="FAILED">Thất bại</option>
                  <option value="REFUNDED">Đã hoàn tiền</option>
                  <option value="EXPIRED">Hết hạn</option>
                </select>
              </div>

              {/* Gateway Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Phương thức</label>
                <select
                  value={filters.gateway}
                  onChange={(e) => setFilters({ ...filters, gateway: e.target.value as FilterGateway })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44]"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="WALLET">My Wallet</option>
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({
                      status: 'ALL',
                      gateway: 'ALL',
                      searchTerm: '',
                      startDate: '',
                      endDate: '',
                    })
                  }
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl py-2 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#78ad44]" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold text-lg">Không có giao dịch nào</p>
            <p className="text-gray-400 text-sm mt-1">Hãy hoàn thành booking để có giao dịch thanh toán</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const statusMeta = STATUS_META[payment.status];
              const gatewayMeta = GATEWAY_META[payment.gateway];

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                    {/* Gateway & Status */}
                    <div className="flex items-center gap-3">
                      <div className={`${statusMeta.bgColor} w-12 h-12 rounded-xl flex items-center justify-center text-xl`}>
                        {statusMeta.icon}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          {gatewayMeta.label} #{payment.id}
                        </p>
                        <p className={`text-xs font-bold ${statusMeta.color}`}>{statusMeta.label}</p>
                      </div>
                    </div>

                    {/* Booking & Type */}
                    <div className="hidden lg:block">
                      <p className="text-xs font-bold text-gray-500">Booking</p>
                      <p className="font-black text-gray-900">{payment.bookingCode}</p>
                      <p className="text-xs text-gray-500 mt-1">{payment.type}</p>
                    </div>

                    {/* Date */}
                    <div className="hidden lg:block">
                      <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <Calendar size={14} /> Ngày
                      </p>
                      <p className="font-medium text-gray-900 text-sm">{formatDateTime(payment.createdAt)}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right lg:text-center">
                      <p className="text-xs font-bold text-gray-500">Số tiền</p>
                      <p className="text-xl font-black text-[#78ad44]">{formatVND(payment.amount)}</p>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="flex-1 sm:flex-none bg-[#f4f8f7] hover:bg-[#e9f2eb] text-gray-700 font-bold rounded-xl py-2 px-4 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        <span className="hidden sm:inline">Chi tiết</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Details */}
                  <div className="lg:hidden mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Booking:</span>
                      <span className="font-black text-gray-900">{payment.bookingCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Loại:</span>
                      <span className="font-medium text-gray-900">{payment.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Ngày:</span>
                      <span className="font-medium text-gray-900">{formatDateTime(payment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDownloadInvoice={handleDownloadInvoice}
      />

      <Footer />
    </div>
  );
}

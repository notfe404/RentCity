import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Download,
  Eye,
  Landmark,
  Loader2,
  Receipt,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import CustomerSidebar from '@/components/layout/CustomerSidebar';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { getMyBookings } from '@/services/bookingApi';
import { downloadBookingInvoicePdf, getMyPayments } from '@/services/paymentApi';
import {
  createBookingPayment,
  createWithdrawalRequest,
  getMyWallet,
  getMyWithdrawalRequests,
} from '@/services/walletApi';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type {
  ApiBookingResponse,
  ApiPaymentResponse,
  ApiWalletResponse,
  ApiWithdrawalRequest,
  PaymentGateway,
  PaymentStatus,
  PaymentType,
} from '@/types';
import PaymentCheckoutModal from '../MyWalletPage/PaymentCheckoutModal';

type TabKey = 'REQUESTS' | 'RECEIPTS' | 'DEPOSITS';
type FilterStatus = PaymentStatus | 'ALL';
type FilterGateway = PaymentGateway | 'ALL';

const STATUS_META: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  PAID: { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-50' },
  FAILED: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-50' },
  REFUNDED: { label: 'Refunded', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  EXPIRED: { label: 'Expired', color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

const GATEWAY_META: Record<string, { label: string; color: string }> = {
  PAYPAL: { label: 'PayPal', color: 'text-blue-700' },
  VNPAY: { label: 'VNPay', color: 'text-indigo-700' },
  CASH: { label: 'Cash', color: 'text-gray-700' },
  WALLET: { label: 'Refund balance', color: 'text-[#78ad44]' },
};

const RECEIPT_REVENUE_TYPES = new Set<PaymentType>(['DEPOSIT', 'FINAL_RENTAL_PAYMENT', 'BALANCE_PAYMENT', 'FULL']);
const SECURITY_DEPOSIT_TYPES = new Set<PaymentType>(['SECURITY_DEPOSIT', 'SECURITY_DEPOSIT_REFUND']);
const PAGE_SIZE = 3;

function paymentTypeLabel(type: PaymentType) {
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

function isDepositOrRefundPayment(payment: ApiPaymentResponse) {
  return SECURITY_DEPOSIT_TYPES.has(payment.type) || payment.type.includes('REFUND') || payment.status === 'REFUNDED';
}

function paymentGatewayMeta(payment: ApiPaymentResponse) {
  if (payment.gateway !== 'CASH' && (payment.type === 'SECURITY_DEPOSIT_REFUND' || payment.status === 'REFUNDED')) {
    return GATEWAY_META.WALLET;
  }
  return GATEWAY_META[payment.gateway] ?? { label: payment.gateway, color: 'text-gray-700' };
}

function pageCount(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
}

function paginate<T>(items: T[], page: number) {
  const safePage = Math.min(Math.max(page, 1), pageCount(items.length));
  const start = (safePage - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<ApiPaymentResponse[]>([]);
  const [wallet, setWallet] = useState<ApiWalletResponse | null>(null);
  const [withdrawals, setWithdrawals] = useState<ApiWithdrawalRequest[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<ApiBookingResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('REQUESTS');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [gatewayFilter, setGatewayFilter] = useState<FilterGateway>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptPage, setReceiptPage] = useState(1);
  const [depositPage, setDepositPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<ApiPaymentResponse | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<ApiPaymentResponse | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: 0,
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });

  const loadPage = useCallback(async () => {
    const [{ data: paymentData }, { data: walletData }, { data: bookingData }, { data: withdrawalData }] =
      await Promise.all([
        getMyPayments(),
        getMyWallet(),
        getMyBookings(),
        getMyWithdrawalRequests(),
      ]);
    setPayments(paymentData);
    setWallet(walletData);
    setWithdrawals(withdrawalData);
    setPaymentRequests(bookingData.filter((booking) => (booking.outstandingAmount ?? 0) > 0));
  }, []);

  const receiptPayments = useMemo(
    () => payments.filter((payment) => !isDepositOrRefundPayment(payment)),
    [payments]
  );
  const depositAndRefundPayments = useMemo(
    () => payments.filter(isDepositOrRefundPayment),
    [payments]
  );

  useEffect(() => {
    loadPage()
      .catch(() => toast.error('Could not load payment information'))
      .finally(() => setIsLoading(false));
  }, [loadPage]);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPage();
    } catch {
      toast.error('Could not refresh payment information');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return receiptPayments.filter((payment) => {
      if (statusFilter !== 'ALL' && payment.status !== statusFilter) return false;
      if (gatewayFilter !== 'ALL' && payment.gateway !== gatewayFilter) return false;
      if (!term) return true;
      return (
        (payment.bookingCode ?? '').toLowerCase().includes(term) ||
        payment.type.toLowerCase().includes(term) ||
        String(payment.id).includes(term)
      );
    });
  }, [receiptPayments, gatewayFilter, searchTerm, statusFilter]);

  const refundableBalance = wallet?.availableBalance ?? 0;
  const pendingWithdrawalTotal = withdrawals
    .filter((request) => request.status === 'PENDING')
    .reduce((sum, request) => sum + request.amount, 0);
  const receiptTotal = filteredPayments
    .filter((payment) => payment.status === 'PAID' && RECEIPT_REVENUE_TYPES.has(payment.type))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const receiptPageCount = pageCount(filteredPayments.length);
  const depositPageCount = pageCount(depositAndRefundPayments.length);
  const withdrawalPageCount = pageCount(withdrawals.length);
  const safeReceiptPage = Math.min(receiptPage, receiptPageCount);
  const safeDepositPage = Math.min(depositPage, depositPageCount);
  const safeWithdrawalPage = Math.min(withdrawalPage, withdrawalPageCount);
  const paginatedReceipts = paginate(filteredPayments, safeReceiptPage);
  const paginatedDeposits = paginate(depositAndRefundPayments, safeDepositPage);
  const paginatedWithdrawals = paginate(withdrawals, safeWithdrawalPage);

  useEffect(() => {
    setReceiptPage(1);
  }, [gatewayFilter, searchTerm, statusFilter]);

  useEffect(() => {
    setDepositPage(1);
  }, [depositAndRefundPayments.length]);

  useEffect(() => {
    setWithdrawalPage(1);
  }, [withdrawals.length]);

  const payBookingRequest = async (booking: ApiBookingResponse, gateway: PaymentGateway) => {
    setPayingBookingId(booking.id);
    try {
      const { data: payment } = await createBookingPayment(booking.id, {
        gateway,
        idempotencyKey: `booking-pay-${booking.id}-${Date.now()}`,
      });
      if (payment.status === 'PAID') {
        toast.success('Payment request already completed');
        await loadPage();
      } else {
        setCheckoutPayment(payment);
      }
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(message ?? 'Could not create payment');
    } finally {
      setPayingBookingId(null);
    }
  };

  const requestWithdrawal = async () => {
    if (!wallet || withdrawalForm.amount <= 0) {
      toast.error('Enter a withdrawal amount');
      return;
    }
    if (withdrawalForm.amount > wallet.availableBalance) {
      toast.error('Withdrawal amount exceeds refundable balance');
      return;
    }
    if (!withdrawalForm.bankName.trim() || !withdrawalForm.accountNumber.trim() || !withdrawalForm.accountHolderName.trim()) {
      toast.error('Complete all banking information');
      return;
    }
    setIsWithdrawing(true);
    try {
      await createWithdrawalRequest(withdrawalForm);
      setWithdrawalForm({ amount: 0, bankName: '', accountNumber: '', accountHolderName: '' });
      await loadPage();
      toast.success('Withdrawal request sent');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(message ?? 'Could not create withdrawal request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const downloadInvoice = async (bookingId: number) => {
    try {
      const { data: blob } = await downloadBookingInvoicePdf(bookingId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${bookingId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Could not download invoice');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Header />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-10">
        <CustomerSidebar />
        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Payment</h1>
              <p className="text-sm text-gray-500 mt-1">
                Payment requests, receipts, deposits, refunds, and withdrawal requests.
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="self-start inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-700 border border-gray-100 shadow-sm hover:bg-[#f4f8f7] disabled:opacity-60"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {isLoading || !wallet ? (
            <div className="bg-white rounded-3xl p-12 flex justify-center border border-gray-100">
              <Loader2 className="animate-spin text-[#78ad44]" />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
		<SummaryCard icon={Receipt} label="Receipt total" value={formatVND(receiptTotal)} tone="dark" />
                <SummaryCard icon={Landmark} label="Refundable balance" value={formatVND(refundableBalance)} tone="green" />
                <SummaryCard icon={Send} label="Pending withdrawals" value={formatVND(pendingWithdrawalTotal)} tone="blue" />
                
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-2 shadow-sm flex flex-wrap gap-2">
                <TabButton active={activeTab === 'REQUESTS'} onClick={() => setActiveTab('REQUESTS')}>
                  Payment Requests
                </TabButton>
                <TabButton active={activeTab === 'RECEIPTS'} onClick={() => setActiveTab('RECEIPTS')}>
                  Receipts
                </TabButton>
                <TabButton active={activeTab === 'DEPOSITS'} onClick={() => setActiveTab('DEPOSITS')}>
                  Deposit and Refunds
                </TabButton>
              </div>

              {activeTab === 'REQUESTS' && (
                <section className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
                  <SectionHeader
                    icon={<AlertTriangle className="text-orange-500" size={20} />}
                    title="Payment Requests"
                    description={`${paymentRequests.length} outstanding request(s) need online payment.`}
                  />
                  {paymentRequests.length === 0 ? (
                    <EmptyState icon={<CreditCard size={40} />} title="No payment requests" text="Outstanding booking payments will appear here." />
                  ) : (
                    <div className="divide-y divide-orange-100">
                      {paymentRequests.map((booking) => (
                        <PaymentRequestRow
                          key={booking.id}
                          booking={booking}
                          isPaying={payingBookingId === booking.id}
                          onPay={payBookingRequest}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'RECEIPTS' && (
                <section className="space-y-4">
                  <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm grid md:grid-cols-3 gap-3">
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Booking code, type, or ID"
                      className="px-4 py-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-[#78ad44]"
                    />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
                      className="px-4 py-3 rounded-xl border border-gray-200 font-bold bg-white outline-none focus:border-[#78ad44]"
                    >
                      <option value="ALL">All statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="FAILED">Failed</option>
                      <option value="REFUNDED">Refunded</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                    <select
                      value={gatewayFilter}
                      onChange={(event) => setGatewayFilter(event.target.value as FilterGateway)}
                      className="px-4 py-3 rounded-xl border border-gray-200 font-bold bg-white outline-none focus:border-[#78ad44]"
                    >
                      <option value="ALL">All methods</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="VNPAY">VNPay</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  {filteredPayments.length === 0 ? (
                    <EmptyState icon={<Receipt size={40} />} title="No receipts found" text="Completed and pending payments will appear here." />
                  ) : (
                    <div className="space-y-3">
                      {paginatedReceipts.map((payment) => (
                        <ReceiptRow
                          key={payment.id}
                          payment={payment}
                          onDetails={setSelectedPayment}
                          onDownload={downloadInvoice}
                          showInvoice
                        />
                      ))}
                      <PaginationControls
                        page={safeReceiptPage}
                        totalPages={receiptPageCount}
                        totalItems={filteredPayments.length}
                        onPageChange={setReceiptPage}
                      />
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'DEPOSITS' && (
                <section className="space-y-4">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <SectionHeader
                      icon={<Landmark className="text-[#78ad44]" size={20} />}
                      title="Deposit and Refunds"
                      description="Security deposit and refund records are separate from rental receipts and do not have invoices."
                    />
                    <div className="p-6 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Available to withdraw</p>
                      <p className="text-3xl font-black text-[#78ad44] mt-1">{formatVND(refundableBalance)}</p>
                    </div>
                    {depositAndRefundPayments.length === 0 ? (
                      <EmptyState icon={<Landmark size={40} />} title="No deposit or refund records" text="Security deposit and refund records will appear here." />
                    ) : (
                      <>
                        <div className="divide-y divide-gray-100">
                          {paginatedDeposits.map((payment) => (
                            <ReceiptRow
                              key={payment.id}
                              payment={payment}
                              onDetails={setSelectedPayment}
                              onDownload={downloadInvoice}
                              showInvoice={false}
                              compact
                            />
                          ))}
                        </div>
                        <PaginationControls
                          page={safeDepositPage}
                          totalPages={depositPageCount}
                          totalItems={depositAndRefundPayments.length}
                          onPageChange={setDepositPage}
                          className="border-t border-gray-100"
                        />
                      </>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm">
                    <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                      <Landmark size={20} className="text-blue-600" /> Request Refund Withdrawal
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 mb-5">
                      Withdrawals are limited to refundable balance from refunds. Customers cannot top up this balance.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        min={1}
                        max={wallet.availableBalance}
                        placeholder="Amount (VND)"
                        value={withdrawalForm.amount || ''}
                        onChange={(event) => setWithdrawalForm((form) => ({ ...form, amount: Number(event.target.value) }))}
                        className="px-4 py-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-blue-500"
                      />
                      <input
                        placeholder="Bank name"
                        value={withdrawalForm.bankName}
                        onChange={(event) => setWithdrawalForm((form) => ({ ...form, bankName: event.target.value }))}
                        className="px-4 py-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-blue-500"
                      />
                      <input
                        placeholder="Account number"
                        value={withdrawalForm.accountNumber}
                        onChange={(event) => setWithdrawalForm((form) => ({ ...form, accountNumber: event.target.value }))}
                        className="px-4 py-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-blue-500"
                      />
                      <input
                        placeholder="Account holder name"
                        value={withdrawalForm.accountHolderName}
                        onChange={(event) => setWithdrawalForm((form) => ({ ...form, accountHolderName: event.target.value }))}
                        className="px-4 py-3 rounded-xl border border-gray-200 font-bold uppercase outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-sm text-gray-500">
                        Available to withdraw: <strong className="text-gray-900">{formatVND(wallet.availableBalance)}</strong>
                      </p>
                      <button
                        onClick={requestWithdrawal}
                        disabled={isWithdrawing || wallet.availableBalance <= 0}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black disabled:bg-gray-300 flex items-center justify-center gap-2"
                      >
                        {isWithdrawing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Send request
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <SectionHeader
                      icon={<Send className="text-blue-600" size={20} />}
                      title="Withdrawal Requests"
                      description="Admin will mark the request completed after sending the refund."
                    />
                    {withdrawals.length === 0 ? (
                      <EmptyState icon={<Send size={40} />} title="No withdrawal requests" text="Requests for refund withdrawal will appear here." />
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {paginatedWithdrawals.map((request) => (
                          <div key={request.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="font-black text-gray-900">{formatVND(request.amount)} to {request.bankName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {request.accountHolderName} | {request.accountNumber} | {formatDateTime(request.createdAt)}
                              </p>
                              {request.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">Reason: {request.rejectionReason}</p>
                              )}
                            </div>
                            <WithdrawalStatusBadge status={request.status} />
                          </div>
                        ))}
                        <PaginationControls
                          page={safeWithdrawalPage}
                          totalPages={withdrawalPageCount}
                          totalItems={withdrawals.length}
                          onPageChange={setWithdrawalPage}
                        />
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />

      {checkoutPayment && (
        <PaymentCheckoutModal
          payment={checkoutPayment}
          onClose={() => setCheckoutPayment(null)}
          onSuccess={() => {
            setCheckoutPayment(null);
            loadPage();
          }}
        />
      )}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onDownload={downloadInvoice}
          showInvoice={!isDepositOrRefundPayment(selectedPayment)}
        />
      )}
    </div>
  );
}

function PaymentRequestRow({
  booking,
  isPaying,
  onPay,
}: {
  booking: ApiBookingResponse;
  isPaying: boolean;
  onPay: (booking: ApiBookingResponse, gateway: PaymentGateway) => void;
}) {
  const [gateway, setGateway] = useState<PaymentGateway>('VNPAY');
  const assessment = booking.damageAssessment;
  const hasOverdueFee = (booking.totalOverdueFee ?? 0) > 0;
  const hasDamageFee = (assessment?.approvedFee ?? 0) > 0;
  const isSecurityDeposit = booking.securityDepositStatus === 'PAYMENT_REQUESTED';
  const isFinalRentalPayment = booking.finalPaymentStatus === 'PAYMENT_REQUESTED';

  return (
    <div className="p-6 grid lg:grid-cols-[1fr_auto] gap-5 items-center">
      <div>
        <p className="font-black text-gray-900">{booking.bookingCode}</p>
        <div className="flex flex-col gap-1 mt-2">
          {hasOverdueFee && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Overdue fee:</span> Returned {booking.overdueMinutes} minutes late.
            </p>
          )}
          {hasDamageFee && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Damage fee:</span> {assessment?.description}
            </p>
          )}
          {isSecurityDeposit && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Vehicle security deposit:</span> Refundable after a good return; retained for damage or maintenance.
            </p>
          )}
          {isFinalRentalPayment && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Final rental payment:</span> Rental price minus reservation fee, plus overdue charges.
            </p>
          )}
        </div>
        <p className="text-red-600 mt-4 text-sm">
          Remaining: <strong>{formatVND(booking.outstandingAmount ?? 0)}</strong>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <select
          value={gateway}
          onChange={(event) => setGateway(event.target.value as PaymentGateway)}
          className="px-4 py-3 rounded-xl border border-orange-200 font-bold bg-white focus:outline-none focus:border-orange-500"
        >
          <option value="VNPAY">VNPay</option>
          <option value="PAYPAL">PayPal</option>
        </select>
        <button
          onClick={() => onPay(booking, gateway)}
          disabled={isPaying}
          className="px-6 py-3 rounded-xl bg-orange-600 text-white font-black disabled:bg-gray-300 flex items-center justify-center gap-2 min-w-[140px]"
        >
          {isPaying && <Loader2 size={16} className="animate-spin" />}
          Pay request
        </button>
      </div>
    </div>
  );
}

function ReceiptRow({
  payment,
  onDetails,
  onDownload,
  showInvoice = true,
  compact = false,
}: {
  payment: ApiPaymentResponse;
  onDetails: (payment: ApiPaymentResponse) => void;
  onDownload: (bookingId: number) => void;
  showInvoice?: boolean;
  compact?: boolean;
}) {
  const statusMeta = STATUS_META[payment.status];
  const gatewayMeta = paymentGatewayMeta(payment);

  return (
    <div className={`bg-white border border-gray-100 ${compact ? 'border-x-0 border-t-0 rounded-none' : 'rounded-2xl shadow-sm'} p-5`}>
      <div className="grid sm:grid-cols-[1fr_auto] gap-4 sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-gray-900">{payment.bookingCode ?? `Payment #${payment.id}`}</p>
            <span className={`px-2 py-1 rounded-lg text-xs font-black ${statusMeta.bgColor} ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            <span className={`text-xs font-black ${gatewayMeta.color}`}>{gatewayMeta.label}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Calendar size={14} />
            {formatDateTime(payment.createdAt)} | {paymentTypeLabel(payment.type)}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <p className="font-black text-xl text-[#78ad44]">{formatVND(payment.amount)}</p>
          <button
            onClick={() => onDetails(payment)}
            className="p-2 rounded-xl bg-[#f4f8f7] text-gray-700 hover:text-[#78ad44]"
            title="Details"
          >
            <Eye size={18} />
          </button>
          {showInvoice && payment.bookingId != null && (
            <button
              onClick={() => onDownload(payment.bookingId!)}
              className="p-2 rounded-xl bg-[#f4f8f7] text-gray-700 hover:text-[#78ad44]"
              title="Download invoice"
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentDetailsModal({
  payment,
  onClose,
  onDownload,
  showInvoice,
}: {
  payment: ApiPaymentResponse;
  onClose: () => void;
  onDownload: (bookingId: number) => void;
  showInvoice: boolean;
}) {
  const statusMeta = STATUS_META[payment.status];
  const gatewayMeta = paymentGatewayMeta(payment);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">{showInvoice ? 'Receipt Details' : 'Deposit/Refund Details'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-black">X</button>
        </div>
        <div className="p-6 space-y-4">
          <div className={`${statusMeta.bgColor} rounded-2xl p-4`}>
            <p className="text-xs font-bold text-gray-500">Status</p>
            <p className={`text-lg font-black ${statusMeta.color}`}>{statusMeta.label}</p>
          </div>
          <DetailRow label="Payment ID" value={`#${payment.id}`} />
          <DetailRow label="Method" value={gatewayMeta.label} />
          <DetailRow label="Type" value={paymentTypeLabel(payment.type)} />
          <DetailRow label="Amount" value={formatVND(payment.amount)} strong />
          <DetailRow label="Created" value={formatDateTime(payment.createdAt)} />
          {payment.paidAt && <DetailRow label="Paid" value={formatDateTime(payment.paidAt)} />}
          {payment.refundedAt && <DetailRow label="Refunded" value={formatDateTime(payment.refundedAt)} />}
          {payment.gatewayReference && <DetailRow label="Reference" value={payment.gatewayReference} />}
          {payment.failureReason && <DetailRow label="Failure" value={payment.failureReason} />}
          {showInvoice && payment.bookingId != null && (
            <button
              onClick={() => onDownload(payment.bookingId!)}
              className="w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-2xl py-3 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-bold text-gray-500">{label}</span>
      <span className={`${strong ? 'font-black text-[#78ad44]' : 'font-bold text-gray-900'} text-right break-all`}>{value}</span>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Landmark;
  label: string;
  value: string;
  tone: 'green' | 'blue' | 'dark';
}) {
  const color = tone === 'green' ? 'text-[#78ad44]' : tone === 'blue' ? 'text-blue-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
      <Icon size={22} className={color} />
      <p className="text-xs font-bold text-gray-500 mt-4">{label}</p>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 rounded-2xl text-sm font-black transition-colors ${
        active ? 'bg-[#78ad44] text-white shadow-sm' : 'text-gray-500 hover:bg-[#f4f8f7] hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 border-b border-gray-100">
      <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="p-10 text-center text-gray-400">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="font-black text-gray-500">{title}</p>
      <p className="text-sm mt-1">{text}</p>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className = '',
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalItems <= PAGE_SIZE) {
    return null;
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-xs font-bold text-gray-400">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 transition-colors hover:bg-[#f4f8f7] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="rounded-xl bg-[#f4f8f7] px-3 py-2 text-xs font-black text-gray-700">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 transition-colors hover:bg-[#f4f8f7] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function WithdrawalStatusBadge({ status }: { status: ApiWithdrawalRequest['status'] }) {
  const style = status === 'COMPLETED'
    ? 'bg-green-50 text-green-700'
    : status === 'REJECTED'
      ? 'bg-red-50 text-red-700'
      : 'bg-orange-50 text-orange-700';
  return <span className={`px-3 py-1 rounded-full text-xs font-black ${style}`}>{status}</span>;
}

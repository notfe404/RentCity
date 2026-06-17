import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, Landmark, Loader2, LockKeyhole, PlusCircle, Send, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import CustomerSidebar from '@/components/layout/CustomerSidebar';
import { getMyBookings } from '@/services/bookingApi';
import {
  createBookingPayment,
  createWalletTopUp,
  createWithdrawalRequest,
  getMyWallet,
  getMyWithdrawalRequests,
} from '@/services/walletApi';
import type { ApiBookingResponse, ApiPaymentResponse, ApiWalletResponse, ApiWithdrawalRequest, PaymentGateway } from '@/types';
import { formatDateTime, formatVND } from '@/utils/formatters';
import PaymentCheckoutModal from './PaymentCheckoutModal';

const TYPE_LABELS: Record<string, string> = {
  TOP_UP: 'Wallet top-up',
  BOOKING_HOLD: 'Booking deposit held',
  HOLD_RELEASE: 'Deposit/refund released',
  FORFEITURE: 'Deposit forfeited',
  OVERDUE_CHARGE: 'Overdue charge',
  DAMAGE_CHARGE: 'Damage charge',
  REFUND_CREDIT: 'Refund credit',
  WITHDRAWAL_REQUEST: 'Withdrawal requested',
  WITHDRAWAL_REVERSED: 'Rejected withdrawal returned',
  ADJUSTMENT: 'Adjustment',
};

export default function MyWalletPage() {
  const [wallet, setWallet] = useState<ApiWalletResponse | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<ApiBookingResponse[]>([]);
  const [withdrawals, setWithdrawals] = useState<ApiWithdrawalRequest[]>([]);
  const [amount, setAmount] = useState(500000);
  const [gateway, setGateway] = useState<PaymentGateway>('VNPAY');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<ApiPaymentResponse | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: 0,
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });

  const loadPage = async () => {
    const [{ data: walletData }, { data: bookings }, { data: withdrawalData }] = await Promise.all([
      getMyWallet(),
      getMyBookings(),
      getMyWithdrawalRequests(),
    ]);
    setWallet(walletData);
    setWithdrawals(withdrawalData);
    setPaymentRequests(
      bookings.filter((booking) => (booking.outstandingAmount ?? 0) > 0),
    );
  };

  useEffect(() => {
    loadPage()
      .catch(() => toast.error('Could not load wallet'))
      .finally(() => setIsLoading(false));
  }, []);

  const topUp = async () => {
    if (amount < 10000) {
      toast.error('Minimum top-up is 10,000 VND');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: payment } = await createWalletTopUp({
        amount,
        gateway,
        idempotencyKey: `wallet-${Date.now()}`,
      });
      setCheckoutPayment(payment);
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(message ?? 'Could not create wallet payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const payBookingRequest = async (booking: ApiBookingResponse, selectedGateway: PaymentGateway) => {
    setPayingBookingId(booking.id);
    try {
      const { data: payment } = await createBookingPayment(booking.id, {
        gateway: selectedGateway,
        idempotencyKey: `booking-pay-${booking.id}-${Date.now()}`,
      });
      if (payment.status === 'PAID' && payment.gateway === 'WALLET') {
        toast.success('Payment request paid fully from wallet');
        await loadPage();
      } else if (payment.status === 'PAID') {
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
      toast.error('Enter a valid withdrawal amount');
      return;
    }
    if (withdrawalForm.amount > wallet.availableBalance) {
      toast.error('Withdrawal amount exceeds available balance');
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
      toast.success('Withdrawal request sent to admin');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(message ?? 'Could not create withdrawal request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Header />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-10">
        <CustomerSidebar />
        <main className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Wallet</h1>
            <p className="text-sm text-gray-500 mt-1">Deposits, refunds, overdue fees, and damage charges.</p>
          </div>

          {isLoading || !wallet ? (
            <div className="bg-white rounded-3xl p-12 flex justify-center">
              <Loader2 className="animate-spin text-[#78ad44]" />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <BalanceCard icon={WalletCards} label="Available balance" value={wallet.availableBalance} color="text-[#78ad44]" />
                <BalanceCard icon={LockKeyhole} label="Held for bookings" value={wallet.heldBalance} color="text-orange-600" />
                <BalanceCard icon={CreditCard} label="Total wallet balance" value={wallet.totalBalance} color="text-gray-900" />
              </div>

              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <PlusCircle size={20} /> Top up wallet
                </h2>
                <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3">
                  <input
                    type="number"
                    min={10000}
                    step={10000}
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                    className="px-4 py-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-[#78ad44]"
                  />
                  <select
                    value={gateway}
                    onChange={(event) => setGateway(event.target.value as PaymentGateway)}
                    className="px-4 py-3 rounded-xl border border-gray-200 font-bold bg-white"
                  >
                    <option value="VNPAY">VNPay</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>
                  <button
                    onClick={topUp}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl bg-[#78ad44] text-white font-black disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Top up
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm">
                <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <Landmark size={20} className="text-blue-600" /> Withdraw funds
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  Enter your bank information. The amount is reserved while admin processes the request.
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
              </section>

              {withdrawals.length > 0 && (
                <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="font-black text-gray-900 text-lg">Withdrawal requests</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {withdrawals.map((request) => (
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
                        <StatusBadge status={request.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {paymentRequests.length > 0 && (
                <section className="bg-white rounded-3xl border border-orange-200 shadow-sm overflow-hidden mb-8">
                  <div className="p-6 border-b border-orange-100 bg-orange-50/50">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="text-orange-500" size={20} />
                      Payment requests
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      You have {paymentRequests.length} outstanding payment request(s).
                    </p>
                  </div>
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
                </section>
              )}

              <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="font-black text-gray-900 text-lg">Wallet transactions</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {wallet.transactions.map((transaction) => {
                    const positive = transaction.type === 'TOP_UP'
                      || transaction.type === 'HOLD_RELEASE'
                      || transaction.type === 'REFUND_CREDIT'
                      || transaction.type === 'WITHDRAWAL_REVERSED';
                    return (
                      <div key={transaction.id} className="p-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black text-gray-900">{TYPE_LABELS[transaction.type] ?? transaction.type}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.bookingId ? `Booking #${transaction.bookingId} · ` : ''}
                            {formatDateTime(transaction.createdAt)}
                          </p>
                          {transaction.description && <p className="text-xs text-gray-400 mt-1">{transaction.description}</p>}
                        </div>
                        <p className={`font-black ${positive ? 'text-[#78ad44]' : 'text-red-600'}`}>
                          {positive ? '+' : '-'}{formatVND(transaction.amount)}
                        </p>
                      </div>
                    );
                  })}
                  {wallet.transactions.length === 0 && (
                    <p className="p-8 text-center text-gray-400 font-bold">No wallet transactions yet.</p>
                  )}
                </div>
              </section>
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
    </div>
  );
}

function StatusBadge({ status }: { status: ApiWithdrawalRequest['status'] }) {
  const style = status === 'COMPLETED'
    ? 'bg-green-50 text-green-700'
    : status === 'REJECTED'
      ? 'bg-red-50 text-red-700'
      : 'bg-orange-50 text-orange-700';
  return <span className={`px-3 py-1 rounded-full text-xs font-black ${style}`}>{status}</span>;
}

function BalanceCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof WalletCards;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
      <Icon size={22} className={color} />
      <p className="text-xs font-bold text-gray-500 mt-4">{label}</p>
      <p className={`text-2xl font-black mt-1 ${color}`}>{formatVND(value)}</p>
    </div>
  );
}

function PaymentRequestRow({ 
  booking, 
  isPaying, 
  onPay 
}: { 
  booking: ApiBookingResponse; 
  isPaying: boolean; 
  onPay: (b: ApiBookingResponse, gateway: PaymentGateway) => void;
}) {
  const [gateway, setGateway] = useState<PaymentGateway>('VNPAY');
  const assessment = booking.damageAssessment;
  
  const hasOverdueFee = (booking.totalOverdueFee ?? 0) > 0;
  const hasDamageFee = (assessment?.approvedFee ?? 0) > 0;
  const isCheckInFee = !hasOverdueFee && !hasDamageFee && (booking.outstandingAmount ?? 0) > 0;

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
          {isCheckInFee && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Check-in balance:</span> Please pay the remaining amount to start your rental.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-sm">
          {hasOverdueFee && (
            <span className="text-gray-500">
              Overdue: <strong className="text-gray-900">{formatVND(booking.totalOverdueFee)}</strong>
            </span>
          )}
          {hasDamageFee && (
            <span className="text-gray-500">
              Damage: <strong className="text-gray-900">{formatVND(assessment?.approvedFee ?? 0)}</strong>
            </span>
          )}
          <span className="text-red-600">
            Remaining: <strong>{formatVND(booking.outstandingAmount ?? 0)}</strong>
          </span>
        </div>
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

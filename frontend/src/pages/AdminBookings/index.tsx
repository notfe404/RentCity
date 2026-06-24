import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Search, Eye, Check, X, CarFront, Play, ClipboardCheck, RotateCcw, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import {
  cancelAdminBooking,
  confirmBookingForTest,
  getAdminBooking,
  getAdminBookings,
  getRentalContract,
  saveHandoverContract,
  saveReturnCondition,
  transitionAdminBooking,
  prepareSecurityDeposit,
  resolveRetainedSecurityDeposit,
} from '@/services/bookingApi';
import type { HandoverContractPayload, ResolveRetainedSecurityDepositPayload, ReturnConditionPayload } from '@/services/bookingApi';
import { getCarById } from '@/services/carApi';
import { BOOKING_STATUS_META, DEPOSIT_STATUS_META, getBookingVehicleName } from '@/utils/bookingMapper';
import { formatDate, formatDateTime, formatVND } from '@/utils/formatters';
import type { AdminBookingTransitionPayload, ApiBookingResponse, ApiBookingStatus, RentalContractResponse, SettlementMethod } from '@/types';
import ReturnConditionModal from './ReturnConditionModal';
import HandoverContractModal from './HandoverContractModal';
import BookingContractDetailsModal from './BookingContractDetailsModal';
import { FinalizeDamageModal } from './FinalizeDamageModal';
import SecurityDepositModal from './SecurityDepositModal';
import ResolveRetainedDepositModal from './ResolveRetainedDepositModal';
import { useAuth } from '@/hooks/useAuth';

type StatusFilter = 'ALL' | ApiBookingStatus;

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PAID', label: 'Paid' },
  { key: 'ONGOING', label: 'Ongoing' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ApiBookingResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [handoverBooking, setHandoverBooking] = useState<ApiBookingResponse | null>(null);
  const [depositBooking, setDepositBooking] = useState<ApiBookingResponse | null>(null);
  const [returnBooking, setReturnBooking] = useState<ApiBookingResponse | null>(null);
  const [finalizeBooking, setFinalizeBooking] = useState<ApiBookingResponse | null>(null);
  const [retainedDepositBooking, setRetainedDepositBooking] = useState<ApiBookingResponse | null>(null);
  const [detailBooking, setDetailBooking] = useState<ApiBookingResponse | null>(null);
  const [detailContract, setDetailContract] = useState<RentalContractResponse | null>(null);
  const [detailContractError, setDetailContractError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await getAdminBookings(statusFilter === 'ALL' ? {} : { status: statusFilter });
        if (!cancelled) {
          setBookings(data);
        }
      } catch {
        if (!cancelled) {
          toast.error('Can not load the admin booking list');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    run();
    const timer = window.setInterval(run, 5000);
    window.addEventListener('focus', run);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', run);
    };
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return bookings;
    }

    return bookings.filter((booking) => {
      const vehicleName = getBookingVehicleName(booking).toLowerCase();
      return (
        booking.bookingCode.toLowerCase().includes(keyword)
        || (booking.customerName ?? '').toLowerCase().includes(keyword)
        || (booking.customerEmail ?? '').toLowerCase().includes(keyword)
        || vehicleName.includes(keyword)
      );
    });
  }, [bookings, search]);

  const runTransition = async (bookingId: number, payload: AdminBookingTransitionPayload, useTestConfirm = false) => {
    setActiveBookingId(bookingId);
    try {
      const { data } = useTestConfirm
        ? await confirmBookingForTest(bookingId)
        : await transitionAdminBooking(bookingId, payload);

      setBookings((current) => current.map((booking) => (booking.id === bookingId ? data : booking)));
      toast.success(`Booking updated ${data.bookingCode}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not update booking';
      toast.error(message);
    } finally {
      setActiveBookingId(null);
    }
  };

  const runCancellation = async (bookingId: number) => {
    setActiveBookingId(bookingId);
    try {
      const { data } = await cancelAdminBooking(bookingId);
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? data : booking)));
      toast.success(`Cancelled booking ${data.bookingCode}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not cancel booking';
      toast.error(message);
    } finally {
      setActiveBookingId(null);
    }
  };

  const submitSecurityDeposit = async (method: SettlementMethod) => {
    if (!depositBooking) return;
    setActiveBookingId(depositBooking.id);
    try {
      const { data } = await prepareSecurityDeposit(depositBooking.id, method);
      setBookings((current) => current.map((booking) => (booking.id === data.id ? data : booking)));
      setDepositBooking(null);
      toast.success(method === 'CASH'
        ? `Cash security deposit recorded for ${data.bookingCode}`
        : `Security deposit payment request sent for ${data.bookingCode}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not prepare the security deposit';
      toast.error(message);
    } finally {
      setActiveBookingId(null);
    }
  };

  const submitHandover = async (payload: HandoverContractPayload) => {
    if (!handoverBooking) return;
    setActiveBookingId(handoverBooking.id);
    try {
      await saveHandoverContract(handoverBooking.id, payload);
      const { data: updatedBooking } = await getAdminBooking(handoverBooking.id);
      setBookings((current) => current.map((booking) => (
        booking.id === updatedBooking.id ? updatedBooking : booking
      )));
      setHandoverBooking(null);
      toast.success(`Vehicle handed over for ${updatedBooking.bookingCode}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not complete the vehicle handover';
      toast.error(message);
    } finally {
      setActiveBookingId(null);
    }
  };

  const openReturnModal = async (booking: ApiBookingResponse) => {
    setActiveBookingId(booking.id);
    try {
      const [{ data: latestBooking }, { data: car }, { data: contract }] = await Promise.all([
        getAdminBooking(booking.id),
        getCarById(booking.vehicleId),
        getRentalContract(booking.id),
      ]);
      const bookingWithRate = {
        ...latestBooking,
        vehiclePricePerDay: car.pricePerDay,
        actualHandoverAt: contract.handoverAt,
      };
      setReturnBooking(bookingWithRate);
      setBookings((current) => current.map((item) => (
        item.id === bookingWithRate.id ? bookingWithRate : item
      )));
    } catch {
      toast.error('Could not load the latest booking details');
    } finally {
      setActiveBookingId(null);
    }
  };

  const submitReturnCondition = async (payload: ReturnConditionPayload) => {
    if (!returnBooking) return;
    setActiveBookingId(returnBooking.id);
    try {
      await saveReturnCondition(returnBooking.id, payload);
      const { data } = await getAdminBooking(returnBooking.id);
      setBookings((current) => current.map((booking) => (booking.id === data.id ? data : booking)));
      setReturnBooking(null);
      toast.success(`Return inspection completed for ${data.bookingCode}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not complete the return inspection';
      toast.error(message);
    } finally {
      setActiveBookingId(null);
    }
  };

  const submitRetainedDepositResolution = async (payload: ResolveRetainedSecurityDepositPayload) => {
    if (!retainedDepositBooking) return;
    setActiveBookingId(retainedDepositBooking.id);
    try {
      await resolveRetainedSecurityDeposit(retainedDepositBooking.id, payload);
      const { data } = await getAdminBooking(retainedDepositBooking.id);
      setBookings((current) => current.map((booking) => (booking.id === data.id ? data : booking)));
      setRetainedDepositBooking(null);
      toast.success(`Retained security deposit resolved for ${data.bookingCode}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error
        ?? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Could not resolve the retained security deposit';
      toast.error(message);
    } finally {
      setActiveBookingId(null);
    }
  };

  const openBookingDetails = async (booking: ApiBookingResponse) => {
    setDetailBooking(booking);
    setDetailContract(null);
    setDetailContractError(null);
    setIsDetailLoading(true);

    try {
      const { data: latestBooking } = await getAdminBooking(booking.id);
      setDetailBooking(latestBooking);

      if (latestBooking.status === 'ONGOING' || latestBooking.status === 'COMPLETED') {
        try {
          const { data: contract } = await getRentalContract(latestBooking.id);
          setDetailContract(contract);
        } catch (error) {
          const message =
            (error as { response?: { data?: { error?: string } } }).response?.data?.error
            ?? 'Could not load the rental contract';
          setDetailContractError(message);
        }
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not load the latest booking details';
      setDetailBooking(null);
      toast.error(message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <AdminLayout title="Bookings Management">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code, customer, vehicle..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]"
            />
          </div>
        </div>

        <div className="flex bg-[#f4f8f7] p-1 rounded-xl overflow-x-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap ${
                statusFilter === filter.key
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f8f7] border-b border-gray-100">
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Booking</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Rental Dates</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Financial</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">Loading booking...</td>
                </tr>
              )}

              {!isLoading && filtered.map((booking) => {
                const bookingMeta = BOOKING_STATUS_META[booking.status];
                const depositMeta = DEPOSIT_STATUS_META[booking.depositStatus];
                const busy = activeBookingId === booking.id;

                return (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group align-top">
                    <td className="p-5">
                      <p className="font-black text-gray-900 text-sm">{booking.bookingCode}</p>
                      <p className="text-xs font-bold text-gray-400 mt-1">#{booking.id}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-gray-900 text-sm">{booking.customerName ?? 'Unknown customer'}</p>
                      <p className="font-bold text-gray-400 text-xs">{booking.customerEmail ?? '—'}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-gray-900 text-sm">{getBookingVehicleName(booking)}</p>
                      <p className="font-bold text-gray-400 text-xs">{booking.vehicleLicensePlate ?? '—'}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">{formatDate(booking.startTime)}</p>
                      <p className="text-xs font-bold text-gray-400">to {formatDate(booking.endTime)}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-[#78ad44] text-sm">{formatVND(booking.totalAmount)}</p>
                      {booking.overdueFee > 0 && (
                        <div className="mt-1 text-xs font-bold text-orange-600">
                          <p>Overdue fee: {formatVND(booking.overdueFee)}</p>
                          <p>Penalty (15% of additional usage fee): {formatVND(booking.penaltyOverdueFee)}</p>
                          <p className="font-black">Total overdue: {formatVND(booking.totalOverdueFee)}</p>
                        </div>
                      )}
                      <p className={`text-xs font-bold mt-1 ${depositMeta.color}`}>{depositMeta.label}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Security deposit: {formatVND(booking.securityDepositAmount)} · {booking.securityDepositStatus.replace('_', ' ')}
                      </p>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border text-white ${bookingMeta.bg}`}>
                        {bookingMeta.label}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => runTransition(
                                booking.id,
                                { targetStatus: 'CONFIRMED', reason: 'TEST_CONFIRMATION', note: 'Confirmed via admin test flow' },
                                true,
                              )}
                              className="p-2 text-white bg-[#78ad44] hover:bg-[#689938] rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                              title="Confirm for test"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => runCancellation(booking.id)}
                              className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                              title="Cancel booking"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}

                        {booking.status === 'CONFIRMED' && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => setDepositBooking(booking)}
                              className="p-2 text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                              title="Collect vehicle security deposit"
                            >
                              <Check size={16} />
                            </button>
                          </>
                        )}

                        {booking.status === 'PAID' && (
                          <button
                            disabled={busy}
                            onClick={() => setHandoverBooking(booking)}
                            className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                            title="Hand over vehicle and sign contract"
                          >
                            <Play size={16} />
                          </button>
                        )}

                        {booking.status === 'ONGOING' && (
                          <button
                            disabled={busy}
                            onClick={() => openReturnModal(booking)}
                            className="p-2 text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                            title="Record return condition"
                          >
                            <ClipboardCheck size={16} />
                          </button>
                        )}

                        {booking.damageAssessment && ['CHARGED', 'PARTIALLY_CHARGED'].includes(booking.damageAssessment.status) && (
                          <button
                            disabled={busy}
                            onClick={() => setFinalizeBooking(booking)}
                            className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                            title="Finalize repair cost"
                          >
                            <Wrench size={16} />
                          </button>
                        )}

                        {user?.role === 'ADMIN'
                          && booking.status === 'COMPLETED'
                          && booking.securityDepositStatus === 'RETAINED'
                          && booking.securityDepositRepairCost == null && (
                          <button
                            disabled={busy}
                            onClick={() => setRetainedDepositBooking(booking)}
                            className="p-2 text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm disabled:bg-gray-300"
                            title="Resolve retained security deposit after repair"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openBookingDetails(booking)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-gray-600 bg-gray-100 hover:bg-[#e9f2eb] hover:text-[#56832d] rounded-lg shadow-sm text-xs font-bold transition-colors"
                          title="View full booking and contract details"
                        >
                          <Eye size={16} />
                          <span>{formatDateTime(booking.createdAt)}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-gray-400">
                      <CarFront size={36} />
                      <p className="font-bold text-gray-500">No bookings match the current filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400">Showing {filtered.length} booking(s)</p>
          <p className="text-xs font-bold text-gray-400">Customer flow uses real backend booking data</p>
        </div>
      </div>
      {handoverBooking && (
        <HandoverContractModal
          key={handoverBooking.id}
          booking={handoverBooking}
          isSaving={activeBookingId === handoverBooking.id}
          onClose={() => setHandoverBooking(null)}
          onSubmit={submitHandover}
        />
      )}
      {depositBooking && (
        <SecurityDepositModal
          booking={depositBooking}
          isSaving={activeBookingId === depositBooking.id}
          onClose={() => setDepositBooking(null)}
          onSubmit={submitSecurityDeposit}
        />
      )}
      {returnBooking && (
        <ReturnConditionModal
          key={returnBooking.id}
          booking={returnBooking}
          isSaving={activeBookingId === returnBooking.id}
          onClose={() => setReturnBooking(null)}
          onSubmit={submitReturnCondition}
        />
      )}
      {finalizeBooking && finalizeBooking.damageAssessment && (
        <FinalizeDamageModal
          isOpen={true}
          onClose={() => setFinalizeBooking(null)}
          bookingId={finalizeBooking.id}
          chargedFee={finalizeBooking.damageAssessment.chargedFee}
          estimatedFee={finalizeBooking.damageAssessment.estimatedFee}
          onSuccess={() => {
            // refresh page
            window.location.reload();
          }}
        />
      )}
      {retainedDepositBooking && (
        <ResolveRetainedDepositModal
          booking={retainedDepositBooking}
          isSaving={activeBookingId === retainedDepositBooking.id}
          onClose={() => setRetainedDepositBooking(null)}
          onSubmit={submitRetainedDepositResolution}
        />
      )}
      {detailBooking && (
        <BookingContractDetailsModal
          booking={detailBooking}
          contract={detailContract}
          contractError={detailContractError}
          isLoading={isDetailLoading}
          onClose={() => {
            setDetailBooking(null);
            setDetailContract(null);
            setDetailContractError(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

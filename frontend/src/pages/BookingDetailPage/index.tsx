import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { ChevronLeft, Calendar, MapPin, Download, CheckCircle2, Ticket, XCircle, AlertTriangle, Car, Star } from 'lucide-react';
import { toast } from 'sonner';

import { cancelMyBooking, downloadRentalContractPdf, getMyBooking, getRentalContract } from '@/services/bookingApi';
import { downloadBookingInvoicePdf } from '@/services/paymentApi';
import { getMyBookingReview } from '@/services/reviewApi';
import {
  BOOKING_STATUS_META,
  DEPOSIT_STATUS_META,
  getBookingDurationLabel,
  getBookingExtraServiceSummary,
  getBookingVehicleImage,
  getBookingVehicleName,
  isBookingCancellable,
} from '@/utils/bookingMapper';
import { formatVND, formatDate, formatDateTime } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import type { ApiBookingResponse, RentalContractResponse, Review } from '@/types';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);
  const [contract, setContract] = useState<RentalContractResponse | null>(null);
  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getMyBooking(id);
        if (!cancelled) {
          setBooking(data);
        }
        if (data.status === 'ONGOING' || data.status === 'COMPLETED') {
          try {
            const { data: contractData } = await getRentalContract(data.id);
            if (!cancelled) setContract(contractData);
          } catch {
            if (!cancelled) setContract(null);
          }
        } else if (!cancelled) {
          setContract(null);
        }
        if (data.status === 'COMPLETED') {
          try {
            const { data: reviewData } = await getMyBookingReview(data.id);
            if (!cancelled) setReview(reviewData);
          } catch {
            if (!cancelled) setReview(null);
          }
        } else if (!cancelled) {
          setReview(null);
        }
      } catch {
        if (!cancelled) {
          setBooking(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Loading booking details...</div>
        <Footer />
      </div>
    );
  }

  // 404
  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><Car size={48} /></div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-500 mb-8">The booking does not exist or has been deleted.</p>
            <button onClick={() => navigate('/my-bookings')} className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg">Back</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusCfg = BOOKING_STATUS_META[booking.status];
  const depositCfg = DEPOSIT_STATUS_META[booking.depositStatus];
  const durationLabel = getBookingDurationLabel(booking);
  const vehicleName = getBookingVehicleName(booking);
  const vehicleImage = getBookingVehicleImage(booking);

  const handleCancel = async () => {
    if (!id || isCancelling) {
      return;
    }

    setIsCancelling(true);
    try {
      const { data } = await cancelMyBooking(id);
      setBooking(data);
      toast.success('Booking cancelled successfully');
      setShowCancelConfirm(false);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not cancel booking';
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (isDownloadingInvoice) {
      return;
    }

    setIsDownloadingInvoice(true);
    try {
      const { data } = await downloadBookingInvoicePdf(booking.id);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentcity-invoice-${booking.bookingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Booking invoice downloaded');
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not download invoice';
      toast.error(message);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleDownloadContract = async () => {
    if (isDownloadingContract) return;
    setIsDownloadingContract(true);
    try {
      const { data } = await downloadRentalContractPdf(booking.id);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentcity-contract-${booking.bookingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Rental contract downloaded');
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Could not download the rental contract';
      toast.error(message);
    } finally {
      setIsDownloadingContract(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex-1">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Back to booking list
        </button>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#212529] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className={`px-3 py-1 text-white text-xs font-black uppercase tracking-wider rounded-lg ${statusCfg.bg}`}>
                  {statusCfg.label}
                </span>
                <span className="text-gray-400 font-bold text-sm">Code: <span className="text-white">{booking.bookingCode}</span></span>
              </div>
              <h1 className="text-3xl font-black text-white">{vehicleName}</h1>
            </div>
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloadingInvoice}
              className="flex items-center gap-2 bg-[#343A40] hover:bg-[#495057] text-white px-5 py-3 rounded-xl font-bold transition-colors text-sm"
            >
              <Download size={16} /> Download invoice
            </button>
          </div>

          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left — Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Rental Period & Location */}
                <section>
                  <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">Time & Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#f4f8f7] p-6 rounded-2xl">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin size={14} className="text-[#78ad44]" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">
                            {booking.pickupMethod === 'ADDRESS_DELIVERY' ? 'Delivery to' : 'Pick-up at'}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {booking.pickupMethod === 'ADDRESS_DELIVERY'
                              ? (booking.deliveryAddress || 'Delivery address not updated')
                              : 'Vehicle branch'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Calendar size={14} className="text-[#78ad44]" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Pick-up date</p>
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(booking.startTime)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin size={14} className="text-gray-400" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Return at</p>
                          <p className="text-sm font-bold text-gray-900">Vehicle branch</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Calendar size={14} className="text-gray-400" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Return date</p>
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(booking.endTime)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Customer Details */}
                <section>
                  <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">Customer Information</h3>
                  <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div><p className="text-xs font-bold text-gray-400 mb-1">Full Name</p><p className="text-sm font-black text-gray-900">{user?.fullName ?? 'Guest'}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 mb-1">Email</p><p className="text-sm font-black text-gray-900">{user?.email ?? '—'}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 mb-1">Phone</p><p className="text-sm font-black text-gray-900">{user?.phone ?? '—'}</p></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">Reservation Fee Status</p>
                        <p className={`text-sm font-black flex items-center gap-1 ${depositCfg.color}`}>
                          {booking.depositStatus === 'PAID' ? <CheckCircle2 size={16} /> : booking.depositStatus === 'REFUNDED' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
                          {depositCfg.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  
                    <div className="flex items-center gap-3 bg-[#f4f8f7] p-4 rounded-xl">
                      <CheckCircle2 size={18} className="text-[#78ad44]" />
                      <span className="text-sm font-bold text-gray-900">Free cancellation until: {formatDateTime(booking.freeCancelUntil)}</span>
                    </div>
                  
                </section>

                {booking.cancelReason && (
                  <section>
                    <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-2">Cancellation Reason</h3>
                    <p className="text-sm text-gray-600 font-medium bg-[#f4f8f7] p-4 rounded-xl">{booking.cancelReason}</p>
                  </section>
                )}

                {contract && (
                  <section>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">Rental contract</h3>
                        <p className="text-xs font-bold text-gray-400">{contract.contractNumber} · Policy {contract.policyVersion}</p>
                      </div>
                      <button onClick={handleDownloadContract} disabled={isDownloadingContract} className="flex items-center gap-2 rounded-xl bg-[#212529] px-4 py-2.5 text-xs font-bold text-white disabled:bg-gray-300">
                        <Download size={15} /> {isDownloadingContract ? 'Preparing...' : 'Download contract'}
                      </button>
                    </div>
                    <div className="space-y-4 rounded-2xl bg-[#f4f8f7] p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500">Contract status</span>
                        <span className="rounded-lg bg-[#e9f2eb] px-3 py-1 text-xs font-black text-[#56832d]">{contract.status.replaceAll('_', ' ')}</span>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-xl bg-white p-4">
                          <p className="font-black text-gray-900">Handover signatures</p>
                          <p className="mt-2 text-xs font-bold text-gray-500">Customer: {formatDateTime(contract.handoverCustomerSignedAt)}</p>
                          <p className="text-xs font-bold text-gray-500">Staff: {formatDateTime(contract.handoverStaffSignedAt)}</p>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                          <p className="font-black text-gray-900">Return signatures</p>
                          {contract.returnCustomerSignedAt ? (
                            <>
                              <p className="mt-2 text-xs font-bold text-gray-500">Customer: {formatDateTime(contract.returnCustomerSignedAt)}</p>
                              <p className="text-xs font-bold text-gray-500">Staff: {formatDateTime(contract.returnStaffSignedAt!)}</p>
                            </>
                          ) : <p className="mt-2 text-xs font-bold text-gray-400">Not returned yet</p>}
                        </div>
                      </div>
                      <details className="rounded-xl bg-white p-4">
                        <summary className="cursor-pointer text-sm font-black text-gray-900">Rental policy</summary>
                        <div className="mt-3 whitespace-pre-line text-xs font-medium leading-6 text-gray-600">{contract.policyText}</div>
                      </details>
                    </div>
                  </section>
                )}

                {booking.initialCondition && (
                  <section>
                    <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">
                      Car condition before rental
                    </h3>
                    <div className="bg-[#f4f8f7] p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500">Overall condition</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                          booking.initialCondition.condition === 'GOOD'
                            ? 'bg-green-100 text-green-700'
                            : booking.initialCondition.condition === 'DAMAGE'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {booking.initialCondition.condition.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-400 font-bold">Odometer</p><p className="font-black">{booking.initialCondition.odometer.toLocaleString()} km</p></div>
                        <div><p className="text-gray-400 font-bold">Fuel</p><p className="font-black">{booking.initialCondition.fuelLevel}%</p></div>
                      </div>
                      {booking.initialCondition.notes && (
                        <p className="text-sm text-gray-600 font-medium">{booking.initialCondition.notes}</p>
                      )}
                    </div>
                  </section>
                )}

                {booking.returnCondition && (
                  <section>
                    <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">
                      Return condition
                    </h3>
                    <div className="bg-[#f4f8f7] p-6 rounded-2xl space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-400 font-bold">Odometer</p><p className="font-black">{booking.returnCondition.odometer.toLocaleString()} km</p></div>
                        <div><p className="text-gray-400 font-bold">Fuel</p><p className="font-black">{booking.returnCondition.fuelLevel}%</p></div>
                      </div>
                      <p className={`inline-flex px-3 py-1 rounded-lg text-xs font-black ${
                        booking.returnCondition.condition === 'GOOD'
                          ? 'bg-green-100 text-green-700'
                          : booking.returnCondition.condition === 'DAMAGE'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {booking.returnCondition.condition.replaceAll('_', ' ')}
                      </p>
                      <p className={`text-sm font-black ${booking.returnCondition.damageFound ? 'text-red-600' : 'text-[#56832d]'}`}>
                        {booking.returnCondition.damageFound ? 'Damage was reported' : 'No damage reported'}
                      </p>
                      {booking.returnCondition.notes && (
                        <p className="text-sm text-gray-600 font-medium">{booking.returnCondition.notes}</p>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right — Receipt */}
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  {vehicleImage ? (
                    <img src={vehicleImage} alt={vehicleName} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200" />
                  )}
                  <div className="p-6 bg-[#f4f8f7]">
                    <h4 className="text-sm font-black text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Ticket size={16} /> Payment Details
                    </h4>
                    <div className="space-y-3 text-sm font-medium text-gray-600 mb-6">
                      <div className="flex justify-between">
                        <span>Vehicle Rental ({durationLabel})</span>
                        <span className="font-bold text-gray-900">{formatVND(booking.baseAmount)}</span>
                      </div>
                      {booking.extraServicesAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Extra services ({getBookingExtraServiceSummary(booking)})</span>
                          <span className="font-bold text-gray-900">{formatVND(booking.extraServicesAmount)}</span>
                        </div>
                      )}
                      {booking.deliveryFeeAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery Fee</span>
                          <span className="font-bold text-gray-900">{formatVND(booking.deliveryFeeAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Reservation Fee (30%)</span>
                        <span className="font-bold text-gray-900">{formatVND(booking.reservationFeeAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vehicle Deposit ({booking.securityDepositStatus.replaceAll('_', ' ')})</span>
                        <span className="font-bold text-gray-900">{formatVND(booking.securityDepositAmount)}</span>
                      </div>
                      {booking.securityDepositRepairCost != null && (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-orange-700 space-y-2">
                          <div className="flex justify-between">
                            <span>Actual repair cost</span>
                            <span className="font-black">{formatVND(booking.securityDepositRepairCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Security deposit refunded</span>
                            <span className="font-black">{formatVND(booking.securityDepositRefundedAmount)}</span>
                          </div>
                        </div>
                      )}
                      {booking.finalPaymentStatus !== 'NOT_DUE' && (
                        <div className="flex justify-between text-[#56832d] font-black">
                          <span>Payment on Return ({booking.finalPaymentStatus.replaceAll('_', ' ')})</span>
                          <span>{formatVND(booking.finalRentalAmount)}</span>
                        </div>
                      )}
                      {booking.overdueFee > 0 && (
                        <>
                          <div className="flex justify-between text-orange-600">
                            <span>Overdue return fee ({Math.ceil(booking.overdueMinutes / 60)}h)</span>
                            <span className="font-black">+{formatVND(booking.overdueFee)}</span>
                          </div>
                          <div className="flex justify-between text-orange-600">
                            <span>Penalty (15% of additional usage fee)</span>
                            <span className="font-black">+{formatVND(booking.penaltyOverdueFee)}</span>
                          </div>
                          <div className="flex justify-between text-orange-700 font-black border-t border-orange-200 pt-2">
                            <span>Total overdue fee</span>
                            <span>+{formatVND(booking.totalOverdueFee)}</span>
                          </div>
                        </>
                      )}
                      {booking.damageAssessment && (
                        <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 space-y-2">
                          <div className="flex justify-between text-orange-700">
                            <span>Damage charge ({booking.damageAssessment.status})</span>
                            <span className="font-black">{formatVND(booking.damageAssessment.approvedFee || booking.damageAssessment.estimatedFee)}</span>
                          </div>
                          <p className="text-xs text-orange-700">{booking.damageAssessment.description}</p>
                          {booking.damageFee > 0 && (
                            <div className="flex justify-between text-red-600 font-black">
                              <span>Damage fee</span>
                              <span>+{formatVND(booking.damageFee)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {booking.outstandingAmount > 0 && (
                        <div className="flex justify-between text-red-700 font-black">
                          <span>Outstanding balance</span>
                          <span>{formatVND(booking.outstandingAmount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                      <span className="font-bold text-gray-500 text-sm">
                        {booking.depositStatus === 'REFUNDED' ? 'Reservation fee refunded' : 'Total'}
                      </span>
                      <span className="font-black text-2xl text-[#78ad44]">{formatVND(booking.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'PENDING' && booking.depositStatus === 'UNPAID' && (
                  <button
                    onClick={() => navigate(`/booking/${booking.id}/payment`)}
                    className="w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold py-4 rounded-xl transition-colors shadow-lg mb-3"
                  >
                    Continue reservation fee payment
                  </button>
                )}
                {isBookingCancellable(booking) && (
                  <>
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full text-red-500 font-bold border-2 border-red-100 hover:bg-red-50 py-4 rounded-xl transition-colors"
                      >
                        Cancel Booking
                      </button>
                    ) : (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 space-y-4">
                        <p className="text-sm font-bold text-red-700">Are you sure you want to cancel this booking?</p>
                        <p className="text-xs text-red-500 font-medium">Cancellation fees may apply according to the cancellation policy.</p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:bg-red-300"
                          >
                            {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition-colors hover:bg-gray-50"
                          >
                            Keep Booking
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {booking.status === 'COMPLETED' && (
                  <div className="space-y-3">
                    {review ? (
                      <div className="w-full bg-[#fff8f0] border border-orange-100 text-orange-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                        <Star size={18} className="fill-orange-500 text-orange-500" /> Trip Reviewed
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/review/${booking.id}`)}
                        className="w-full bg-[#f99200] hover:bg-[#e08800] text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <Star size={18} className="fill-white" /> Review Trip
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/vehicles/${booking.vehicleId}`)}
                      className="w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                    >
                      Book This Vehicle Again
                    </button>
                  </div>
                )}

                <p className="text-xs text-center text-gray-400 font-medium">
                  Booking created: {formatDate(booking.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

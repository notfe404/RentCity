import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { ChevronLeft, Calendar, MapPin, Download, CheckCircle2, Ticket, XCircle, AlertTriangle, Car, Star } from 'lucide-react';
import { toast } from 'sonner';

import { cancelMyBooking, getMyBooking } from '@/services/bookingApi';
import { downloadBookingInvoicePdf } from '@/services/paymentApi';
import { getMyBookingReview } from '@/services/reviewApi';
import { BOOKING_STATUS_META, DEPOSIT_STATUS_META, getBookingDurationLabel, getBookingVehicleImage, getBookingVehicleName, isBookingCancellable } from '@/utils/bookingMapper';
import { formatVND, formatDate, formatDateTime } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import type { ApiBookingResponse, Review } from '@/types';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
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
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Đang tải chi tiết booking...</div>
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
            <h2 className="text-3xl font-black text-gray-900 mb-2">Không tìm thấy đơn</h2>
            <p className="text-gray-500 mb-8">Đơn đặt xe không tồn tại hoặc đã bị xóa.</p>
            <button onClick={() => navigate('/my-bookings')} className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg">Quay lại</button>
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
      toast.success('Đã hủy booking thành công');
      setShowCancelConfirm(false);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Không thể hủy booking';
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
    toast.success('Đã tải hóa đơn booking');
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Không thể tải hóa đơn';
      toast.error(message);
    } finally {
      setIsDownloadingInvoice(false);
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
          <ChevronLeft size={16} /> Quay lại danh sách đơn
        </button>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#212529] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className={`px-3 py-1 text-white text-xs font-black uppercase tracking-wider rounded-lg ${statusCfg.bg}`}>
                  {statusCfg.label}
                </span>
                <span className="text-gray-400 font-bold text-sm">Mã: <span className="text-white">{booking.bookingCode}</span></span>
              </div>
              <h1 className="text-3xl font-black text-white">{vehicleName}</h1>
            </div>
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloadingInvoice}
              className="flex items-center gap-2 bg-[#343A40] hover:bg-[#495057] text-white px-5 py-3 rounded-xl font-bold transition-colors text-sm"
            >
              <Download size={16} /> Tải hoá đơn
            </button>
          </div>

          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left — Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Rental Period & Location */}
                <section>
                  <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">Thời gian & Địa điểm</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#f4f8f7] p-6 rounded-2xl">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin size={14} className="text-[#78ad44]" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Nhận xe tại</p>
                          <p className="text-sm font-bold text-gray-900">Chi nhánh Cầu Giấy</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Calendar size={14} className="text-[#78ad44]" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Ngày nhận</p>
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(booking.startTime)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin size={14} className="text-gray-400" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Trả xe tại</p>
                          <p className="text-sm font-bold text-gray-900">Chi nhánh Cầu Giấy</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Calendar size={14} className="text-gray-400" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Ngày trả</p>
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(booking.endTime)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Customer Details */}
                <section>
                  <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">Thông tin khách hàng</h3>
                  <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div><p className="text-xs font-bold text-gray-400 mb-1">Họ tên</p><p className="text-sm font-black text-gray-900">{user?.fullName ?? 'Khách'}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 mb-1">Email</p><p className="text-sm font-black text-gray-900">{user?.email ?? '—'}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 mb-1">Điện thoại</p><p className="text-sm font-black text-gray-900">{user?.phone ?? '—'}</p></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">Trạng thái cọc</p>
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
                      <span className="text-sm font-bold text-gray-900">Hủy miễn phí đến: {formatDateTime(booking.freeCancelUntil)}</span>
                    </div>
                  
                </section>

                {booking.cancelReason && (
                  <section>
                    <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-2">Lý do hủy</h3>
                    <p className="text-sm text-gray-600 font-medium bg-[#f4f8f7] p-4 rounded-xl">{booking.cancelReason}</p>
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
                      <Ticket size={16} /> Chi tiết thanh toán
                    </h4>
                    <div className="space-y-3 text-sm font-medium text-gray-600 mb-6">
                      <div className="flex justify-between">
                        <span>Thuê xe ({durationLabel})</span>
                        <span className="font-bold text-gray-900">{formatVND(booking.baseAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiền cọc</span>
                        <span className="font-bold text-gray-900">{formatVND(booking.depositAmount)}</span>
                      </div>
                      {booking.overdueFee > 0 && (
                        <>
                          <div className="flex justify-between text-orange-600">
                            <span>Overdue return fee ({Math.ceil(booking.overdueMinutes / 60)}h)</span>
                            <span className="font-black">+{formatVND(booking.overdueFee)}</span>
                          </div>
                          <div className="flex justify-between text-orange-600">
                            <span>Penalty overdue fee (15%)</span>
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
                        {booking.depositStatus === 'REFUNDED' ? 'Đã hoàn cọc' : 'Tổng cộng'}
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
                    Tiếp tục thanh toán cọc
                  </button>
                )}
                {isBookingCancellable(booking) && (
                  <>
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full text-red-500 font-bold border-2 border-red-100 hover:bg-red-50 py-4 rounded-xl transition-colors"
                      >
                        Hủy đơn đặt xe
                      </button>
                    ) : (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 space-y-4">
                        <p className="text-sm font-bold text-red-700">Bạn chắc chắn muốn hủy đơn này?</p>
                        <p className="text-xs text-red-500 font-medium">Phí hủy có thể áp dụng theo chính sách hủy.</p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:bg-red-300"
                          >
                            {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition-colors hover:bg-gray-50"
                          >
                            Giữ đơn
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
                        <Star size={18} className="fill-orange-500 text-orange-500" /> Đã đánh giá chuyến xe
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/review/${booking.id}`)}
                        className="w-full bg-[#f99200] hover:bg-[#e08800] text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <Star size={18} className="fill-white" /> Đánh giá chuyến xe
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/vehicles/${booking.vehicleId}`)}
                      className="w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                    >
                      Đặt lại xe này
                    </button>
                  </div>
                )}

                <p className="text-xs text-center text-gray-400 font-medium">
                  Ngày tạo đơn: {formatDate(booking.createdAt)}
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

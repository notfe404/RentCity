import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { ChevronLeft, Calendar, MapPin, Download, CheckCircle2, Ticket, XCircle, AlertTriangle, Car } from 'lucide-react';
import { toast } from 'sonner';

import { MOCK_BOOKINGS, BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/data/mockBookings';
import { formatVND, formatDate, formatDateTime } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const booking = MOCK_BOOKINGS.find(b => b.id === id);

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

  const statusCfg = BOOKING_STATUS_LABEL[booking.status];

  const handleCancel = () => {
    toast.success('Đã gửi yêu cầu hủy đơn. Tiền cọc sẽ hoàn trong 3-5 ngày.');
    setShowCancelConfirm(false);
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
              <h1 className="text-3xl font-black text-white">{booking.vehicle.name}</h1>
            </div>
            <button
              onClick={() => toast.info('Tính năng tải hóa đơn sẽ sớm ra mắt!')}
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
                          <p className="text-sm font-bold text-gray-900">{booking.pickupLocationName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Calendar size={14} className="text-[#78ad44]" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Ngày nhận</p>
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(booking.startDate)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin size={14} className="text-gray-400" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Trả xe tại</p>
                          <p className="text-sm font-bold text-gray-900">{booking.returnLocationName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Calendar size={14} className="text-gray-400" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Ngày trả</p>
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(booking.endDate)}</p>
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
                        <p className="text-xs font-bold text-gray-400 mb-1">Thanh toán</p>
                        <p className={`text-sm font-black flex items-center gap-1 ${booking.paymentStatus === 'paid' ? 'text-[#78ad44]' : booking.paymentStatus === 'refunded' ? 'text-gray-500' : 'text-yellow-500'}`}>
                          {booking.paymentStatus === 'paid' ? <CheckCircle2 size={16} /> : booking.paymentStatus === 'refunded' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
                          {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Extras */}
                <section>
                  <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">Dịch vụ đã chọn</h3>
                  <div className="space-y-3">
                    {booking.extras.length === 0 && (
                      <p className="text-sm text-gray-400 font-medium">Không có dịch vụ bổ sung.</p>
                    )}
                    {booking.extras.map(e => (
                      <div key={e} className="flex items-center gap-3 bg-[#f4f8f7] p-4 rounded-xl">
                        <CheckCircle2 size={18} className="text-[#78ad44]" />
                        <span className="text-sm font-bold text-gray-900">{e}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Customer note */}
                {booking.customerNote && (
                  <section>
                    <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-2">Ghi chú</h3>
                    <p className="text-sm text-gray-600 font-medium bg-[#f4f8f7] p-4 rounded-xl">{booking.customerNote}</p>
                  </section>
                )}
              </div>

              {/* Right — Receipt */}
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={booking.vehicle.image} alt={booking.vehicle.name} className="w-full h-48 object-cover" />
                  <div className="p-6 bg-[#f4f8f7]">
                    <h4 className="text-sm font-black text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Ticket size={16} /> Chi tiết thanh toán
                    </h4>
                    <div className="space-y-3 text-sm font-medium text-gray-600 mb-6">
                      <div className="flex justify-between">
                        <span>Thuê xe ({booking.totalDays} ngày)</span>
                        <span className="font-bold text-gray-900">{formatVND(booking.baseAmount)}</span>
                      </div>
                      {booking.extrasAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Dịch vụ bổ sung</span>
                          <span className="font-bold text-gray-900">{formatVND(booking.extrasAmount)}</span>
                        </div>
                      )}
                      {booking.discountAmount > 0 && (
                        <div className="flex justify-between text-[#78ad44]">
                          <span>Giảm giá</span>
                          <span className="font-bold">-{formatVND(booking.discountAmount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                      <span className="font-bold text-gray-500 text-sm">
                        {booking.paymentStatus === 'refunded' ? 'Đã hoàn' : 'Tổng cộng'}
                      </span>
                      <span className="font-black text-2xl text-[#78ad44]">{formatVND(booking.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'upcoming' && (
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
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
                          >
                            Xác nhận hủy
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

                {booking.status === 'completed' && (
                  <button
                    onClick={() => navigate(`/vehicles/${booking.vehicleId}`)}
                    className="w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                  >
                    Đặt lại xe này
                  </button>
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

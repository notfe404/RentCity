import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { AlertTriangle, CheckCircle2, Clock3, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';

import BookingStepper from '@/components/booking/BookingStepper';
import { getMyBooking } from '@/services/bookingApi';
import { DEPOSIT_STATUS_META, getBookingVehicleImage, getBookingVehicleName } from '@/utils/bookingMapper';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type { ApiBookingResponse } from '@/types';

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch {
        if (!cancelled) {
          toast.error('Không tải được thông tin booking');
          navigate('/my-bookings', { replace: true });
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
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Đang tải booking...</div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const depositMeta = DEPOSIT_STATUS_META[booking.depositStatus];
  const vehicleImage = getBookingVehicleImage(booking);
  const vehicleName = getBookingVehicleName(booking);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        <BookingStepper currentStep={3} />

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-10">
          <div className="space-y-8">
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#fff7e8] flex items-center justify-center text-orange-500 shrink-0">
                  <Clock3 size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Booking đã được tạo</h1>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed">
                    Booking của bạn hiện ở trạng thái <span className="font-black text-orange-500">PENDING</span>.
                    Vui lòng thanh toán tiền cọc để xe được giữ ở Showroom.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Thông tin cọc hiện tại</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[#f4f8f7] rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mã booking</p>
                  <p className="text-xl font-black text-gray-900">{booking.bookingCode}</p>
                </div>
                <div className="bg-[#f4f8f7] rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Trạng thái cọc</p>
                  <p className={`text-lg font-black ${depositMeta.color}`}>{depositMeta.label}</p>
                </div>
                <div className="bg-[#f4f8f7] rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tiền cọc</p>
                  <p className="text-2xl font-black text-[#78ad44]">{formatVND(booking.depositAmount)}</p>
                </div>
                <div className="bg-[#f4f8f7] rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hủy miễn phí đến</p>
                  <p className="text-lg font-black text-gray-900">{formatDateTime(booking.freeCancelUntil)}</p>
                </div>
              </div>
            </section>

            
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 px-2 mb-6">Tóm tắt booking</h3>
              <div className="flex gap-4 items-center bg-[#f4f8f7] p-3 rounded-2xl mb-6">
                {vehicleImage ? (
                  <img src={vehicleImage} alt={vehicleName} className="w-24 h-16 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-gray-200" />
                )}
                <div>
                  <h4 className="font-black text-gray-900">{vehicleName}</h4>
                  <p className="text-xs text-gray-500 font-bold mt-1">{booking.vehicleLicensePlate ?? 'Chưa có biển số'}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm font-bold text-gray-600 px-2">
                <div className="flex justify-between">
                  <span>Nhận xe</span>
                  <span className="text-gray-900">{formatDateTime(booking.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trả xe</span>
                  <span className="text-gray-900">{formatDateTime(booking.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng tiền</span>
                  <span className="text-[#78ad44]">{formatVND(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền cọc</span>
                  <span className="text-[#78ad44]">{formatVND(booking.depositAmount)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate(`/booking/${booking.id}/result`)}
                  className="w-full bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Xem kết quả booking
                </button>
                <button
                  onClick={() => navigate(`/my-bookings/${booking.id}`)}
                  className="w-full bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Xem chi tiết booking
                </button>
                <Link
                  to="/my-bookings"
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl py-4 transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Đến danh sách booking
                </Link>
              </div>

              
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

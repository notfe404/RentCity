import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Star, ChevronLeft, Send, Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getMyBooking } from '@/services/bookingApi';
import api from '@/services/api';
import { getBookingVehicleName } from '@/utils/bookingMapper';
import type { ApiBookingResponse } from '@/types';

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={32}
              className={`transition-colors ${
                star <= (hovered || value) ? 'fill-[#f99200] text-[#f99200]' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-bold text-gray-500 self-center">
          {(hovered || value) > 0 ? ['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc'][hovered || value] : 'Chưa đánh giá'}
        </span>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!bookingId) { setIsLoading(false); return; }
      try {
        const { data } = await getMyBooking(bookingId);
        if (!cancelled) setBooking(data);
      } catch {
        if (!cancelled) toast.error('Không tìm thấy đơn đặt xe');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (overallRating === 0 || vehicleRating === 0 || serviceRating === 0) {
      toast.error('Vui lòng đánh giá tất cả các mục');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/reviews', {
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        overallRating,
        vehicleRating,
        serviceRating,
        comment: comment.trim() || undefined,
      });
      toast.success('Cảm ơn bạn đã đánh giá!');
      navigate(`/my-bookings/${booking.id}`);
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Không thể gửi đánh giá';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#78ad44]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking || booking.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Car size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Không thể đánh giá</h2>
            <p className="text-gray-500 mb-6">Chỉ có thể đánh giá sau khi chuyến xe hoàn thành.</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg"
            >
              Quay lại
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const vehicleName = getBookingVehicleName(booking);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-28 pb-20 px-4 sm:px-6 max-w-2xl mx-auto w-full flex-1">
        <button
          onClick={() => navigate(`/my-bookings/${booking.id}`)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Quay lại chi tiết booking
        </button>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#212529] p-8 text-center">
            <div className="w-16 h-16 bg-[#78ad44] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star size={32} className="text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Đánh giá chuyến xe</h1>
            <p className="text-gray-400 font-medium">{vehicleName}</p>
            <p className="text-gray-500 text-sm mt-1">Mã: {booking.bookingCode}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <StarRating value={overallRating} onChange={setOverallRating} label="Đánh giá tổng thể *" />
            <StarRating value={vehicleRating} onChange={setVehicleRating} label="Tình trạng xe *" />
            <StarRating value={serviceRating} onChange={setServiceRating} label="Dịch vụ của chúng tôi *" />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nhận xét của bạn</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Chia sẻ trải nghiệm của bạn về chuyến xe này..."
                className="w-full px-5 py-4 bg-[#f4f8f7] border border-transparent rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/30 focus:border-[#78ad44] resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate(`/my-bookings/${booking.id}`)}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors"
              >
                Bỏ qua
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-2xl transition-colors shadow-lg shadow-[#78ad44]/20 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Gửi đánh giá
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

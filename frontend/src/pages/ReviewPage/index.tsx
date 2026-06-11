import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import {
  AlertCircle,
  CalendarDays,
  Car,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Hash,
  Loader2,
  RotateCw,
  Send,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { getMyBooking } from '@/services/bookingApi';
import { createReview, getMyBookingReview } from '@/services/reviewApi';
import {
  getBookingDurationLabel,
  getBookingVehicleImage,
  getBookingVehicleName,
} from '@/utils/bookingMapper';
import { formatDateTime } from '@/utils/formatters';
import type { ApiBookingResponse, Review } from '@/types';

const RATING_LABELS = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Xuất sắc'];

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  label: string;
  description?: string;
  prominent?: boolean;
  showError?: boolean;
  readOnly?: boolean;
}

function getResponseStatus(error: unknown) {
  return (error as { response?: { status?: number } }).response?.status;
}

function StarRating({
  value,
  onChange,
  label,
  description,
  prominent = false,
  showError = false,
  readOnly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const activeValue = readOnly ? value : hovered || value;
  const starSize = prominent ? 38 : 30;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className={`font-black text-gray-900 ${prominent ? 'text-lg' : 'text-sm'}`}>{label}</p>
          {description && <p className="text-sm font-medium text-gray-500 mt-1">{description}</p>}
        </div>
        <span className={`text-sm font-black min-h-5 ${activeValue > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
          {activeValue > 0 ? RATING_LABELS[activeValue] : 'Chưa đánh giá'}
        </span>
      </div>

      <div className={`flex items-center gap-1.5 ${prominent ? 'mt-5' : 'mt-4'}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="w-11 h-11 inline-flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78ad44] focus-visible:ring-offset-2 transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
            aria-label={`${star} sao - ${RATING_LABELS[star]}`}
            aria-pressed={star <= value}
          >
            <Star
              size={starSize}
              className={`transition-colors ${
                star <= activeValue ? 'fill-[#f99200] text-[#f99200]' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      {showError && value === 0 && (
        <p className="mt-2 text-xs font-bold text-red-500">Vui lòng chọn số sao cho mục này.</p>
      )}
    </div>
  );
}

function ReviewLoading() {
  return (
    <div className="min-h-screen bg-[#f6f8f7] flex flex-col font-sans">
      <Header />
      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-5 w-44 bg-gray-200 rounded mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
            <div>
              <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
              <div className="h-8 w-52 bg-gray-200 rounded mt-6" />
              <div className="h-20 bg-gray-200 rounded-lg mt-6" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-8">
              <div className="h-8 w-64 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-100 rounded-lg mt-8" />
              <div className="h-20 bg-gray-100 rounded-lg mt-6" />
              <div className="h-32 bg-gray-100 rounded-lg mt-6" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reviewCheckError, setReviewCheckError] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');

  const loadPage = useCallback(async () => {
    if (!bookingId) {
      setLoadError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    setReviewCheckError(false);

    try {
      const { data: bookingData } = await getMyBooking(bookingId);
      setBooking(bookingData);
      setExistingReview(null);

      if (bookingData.status === 'COMPLETED') {
        try {
          const { data: reviewData } = await getMyBookingReview(bookingData.id);
          setExistingReview(reviewData);
        } catch (error) {
          if (getResponseStatus(error) !== 404) {
            setReviewCheckError(true);
          }
        }
      }
    } catch {
      setBooking(null);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const ratingsComplete = overallRating > 0 && vehicleRating > 0 && serviceRating > 0;
  const hasStartedRating = overallRating > 0 || vehicleRating > 0 || serviceRating > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!booking || existingReview || !ratingsComplete || reviewCheckError || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data } = await createReview({
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        overallRating,
        vehicleRating,
        serviceRating,
        comment: comment.trim() || undefined,
      });
      setExistingReview(data);
      toast.success('Cảm ơn bạn đã chia sẻ trải nghiệm!');
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Không thể gửi đánh giá';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <ReviewLoading />;

  if (loadError || !booking || booking.status !== 'COMPLETED') {
    const title = loadError || !booking ? 'Không tải được chuyến đi' : 'Chưa thể đánh giá';
    const description = loadError || !booking
      ? 'Thông tin booking hiện chưa thể tải. Vui lòng thử lại.'
      : 'Bạn chỉ có thể đánh giá sau khi chuyến xe hoàn thành.';

    return (
      <div className="min-h-screen bg-[#f6f8f7] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-28">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-5">
              {loadError ? <AlertCircle size={30} className="text-red-500" /> : <Car size={30} className="text-gray-400" />}
            </div>
            <h1 className="text-2xl font-black text-gray-900">{title}</h1>
            <p className="text-sm font-medium text-gray-500 leading-relaxed mt-3">{description}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
              {loadError && (
                <button
                  type="button"
                  onClick={loadPage}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#78ad44] text-white font-bold"
                >
                  <RotateCw size={17} /> Thử lại
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold"
              >
                Về danh sách booking
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const vehicleName = getBookingVehicleName(booking);
  const vehicleImage = getBookingVehicleImage(booking);
  const durationLabel = getBookingDurationLabel(booking);

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex flex-col font-sans">
      <Header />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            onClick={() => navigate(`/my-bookings/${booking.id}`)}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-7 transition-colors"
          >
            <ChevronLeft size={17} /> Quay lại chi tiết booking
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 xl:gap-12 items-start">
            <aside>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-200">
                {vehicleImage ? (
                  <img src={vehicleImage} alt={vehicleName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <CarFront size={52} />
                  </div>
                )}
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/95 text-xs font-black text-[#78ad44] shadow-sm">
                  Chuyến đi đã hoàn thành
                </span>
              </div>

              <div className="mt-6">
                <p className="text-xs font-black uppercase text-[#78ad44]">Chuyến xe của bạn</p>
                <h2 className="text-3xl font-black text-gray-900 mt-2">{vehicleName}</h2>
                <p className="text-sm font-bold text-gray-500 mt-2">
                  {booking.vehicleLicensePlate ?? 'Chưa cập nhật biển số'}
                </p>
              </div>

              <div className="mt-7 border-y border-gray-200 divide-y divide-gray-200">
                <div className="py-4 flex items-start gap-3">
                  <Hash size={18} className="text-[#78ad44] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-400">Mã booking</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{booking.bookingCode}</p>
                  </div>
                </div>
                <div className="py-4 flex items-start gap-3">
                  <CalendarDays size={18} className="text-[#78ad44] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-400">Thời gian thuê</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{formatDateTime(booking.startTime)}</p>
                    <p className="text-sm font-medium text-gray-500 mt-1">đến {formatDateTime(booking.endTime)}</p>
                  </div>
                </div>
                <div className="py-4 flex items-start gap-3">
                  <Clock3 size={18} className="text-[#78ad44] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-400">Thời lượng</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{durationLabel}</p>
                  </div>
                </div>
              </div>
            </aside>

            <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 sm:p-8 lg:p-10">
              {existingReview ? (
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#e9f2eb] flex items-center justify-center text-[#78ad44]">
                    <CheckCircle2 size={25} />
                  </div>
                  <p className="text-xs font-black uppercase text-[#78ad44] mt-6">Đánh giá đã được ghi nhận</p>
                  <h1 className="text-3xl font-black text-gray-900 mt-2">Cảm ơn bạn đã chia sẻ</h1>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed mt-3">
                    Phản hồi của bạn giúp RentCity và những khách hàng tiếp theo có trải nghiệm tốt hơn.
                  </p>

                  <div className="mt-8 divide-y divide-gray-100 border-y border-gray-100">
                    <div className="py-5">
                      <StarRating value={existingReview.overallRating} label="Đánh giá tổng thể" prominent readOnly />
                    </div>
                    <div className="py-5">
                      <StarRating value={existingReview.vehicleRating} label="Tình trạng xe" readOnly />
                    </div>
                    <div className="py-5">
                      <StarRating value={existingReview.serviceRating} label="Dịch vụ RentCity" readOnly />
                    </div>
                  </div>

                  {existingReview.comment && (
                    <div className="mt-6">
                      <p className="text-xs font-black uppercase text-gray-400">Nhận xét của bạn</p>
                      <p className="text-sm font-medium text-gray-700 leading-relaxed mt-3">{existingReview.comment}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => navigate(`/vehicles/${booking.vehicleId}`)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#78ad44] hover:bg-[#689938] text-white font-bold transition-colors"
                    >
                      <CarFront size={18} /> Xem chi tiết xe
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/my-bookings/${booking.id}`)}
                      className="inline-flex items-center justify-center px-5 py-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold transition-colors"
                    >
                      Về chi tiết booking
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-xs font-black uppercase text-[#78ad44]">Chia sẻ trải nghiệm</p>
                  <h1 className="text-3xl font-black text-gray-900 mt-2">Chuyến đi vừa rồi thế nào?</h1>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed mt-3">
                    Chỉ mất khoảng một phút. Hãy đánh giá dựa trên trải nghiệm thực tế của bạn.
                  </p>

                  {reviewCheckError && (
                    <div className="mt-6 flex items-start gap-3 p-4 border border-red-100 bg-red-50 rounded-lg">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-700">Không kiểm tra được trạng thái đánh giá.</p>
                        <p className="text-xs font-medium text-red-600 mt-1">Hãy thử lại trước khi gửi để tránh tạo đánh giá trùng.</p>
                      </div>
                      <button type="button" onClick={loadPage} className="text-xs font-black text-red-700 hover:underline">
                        Thử lại
                      </button>
                    </div>
                  )}

                  <div className="mt-8 divide-y divide-gray-100 border-y border-gray-100">
                    <div className="py-6">
                      <StarRating
                        value={overallRating}
                        onChange={setOverallRating}
                        label="Đánh giá tổng thể"
                        description="Ấn tượng chung của bạn về chuyến đi"
                        prominent
                        showError={submitAttempted || hasStartedRating}
                      />
                    </div>
                    <div className="py-6">
                      <StarRating
                        value={vehicleRating}
                        onChange={setVehicleRating}
                        label="Tình trạng xe"
                        description="Độ sạch sẽ, vận hành và tiện nghi"
                        showError={submitAttempted || hasStartedRating}
                      />
                    </div>
                    <div className="py-6">
                      <StarRating
                        value={serviceRating}
                        onChange={setServiceRating}
                        label="Dịch vụ RentCity"
                        description="Quy trình nhận trả xe và hỗ trợ"
                        showError={submitAttempted || hasStartedRating}
                      />
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label htmlFor="review-comment" className="text-sm font-black text-gray-900">Nhận xét của bạn</label>
                      <span className="text-xs font-bold text-gray-400">{comment.length}/500</span>
                    </div>
                    <textarea
                      id="review-comment"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={5}
                      maxLength={500}
                      placeholder="Điều gì khiến chuyến đi đáng nhớ? Xe và dịch vụ có đáp ứng mong đợi của bạn không?"
                      className="w-full px-4 py-3.5 bg-[#f6f8f7] border border-gray-200 rounded-lg text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#78ad44]/25 focus:border-[#78ad44] resize-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => navigate(`/my-bookings/${booking.id}`)}
                      className="sm:w-36 px-5 py-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold transition-colors"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      disabled={!ratingsComplete || reviewCheckError || isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#78ad44] hover:bg-[#689938] text-white font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Gửi đánh giá
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

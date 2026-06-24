import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Eye, EyeOff, Loader2, MessageSquare, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminGetReviews,
  adminReplyToReview,
  adminUpdateReviewVisibility,
} from '@/services/reviewApi';
import { formatDateTime } from '@/utils/formatters';
import type { Review } from '@/types';

type VisibilityFilter = 'ALL' | 'LOW_RATING' | 'VISIBLE' | 'HIDDEN';

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          className={star <= value ? 'fill-[#f99200] text-[#f99200]' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<VisibilityFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await adminGetReviews();
        if (!cancelled) {
          setReviews(data);
          setReplyDrafts(Object.fromEntries(data.map((review) => [String(review.id), review.staffReply ?? ''])));
        }
      } catch {
        if (!cancelled) toast.error('Could not load review list');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    if (filter === 'LOW_RATING') return reviews.filter((review) => review.overallRating <= 3);
    if (filter === 'VISIBLE') return reviews.filter((review) => review.isVisible);
    if (filter === 'HIDDEN') return reviews.filter((review) => !review.isVisible);
    return reviews;
  }, [filter, reviews]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / reviews.length
    : 0;

  const handleVisibility = async (review: Review) => {
    setActiveId(review.id);
    try {
      const { data } = await adminUpdateReviewVisibility(review.id, !review.isVisible);
      setReviews((current) => current.map((item) => item.id === review.id ? data : item));
      toast.success(data.isVisible ? 'Review is now visible' : 'Review is now hidden');
    } catch {
      toast.error('Could not update review status');
    } finally {
      setActiveId(null);
    }
  };

  const handleReply = async (review: Review) => {
    setActiveId(review.id);
    try {
      const { data } = await adminReplyToReview(review.id, replyDrafts[String(review.id)] ?? '');
      setReviews((current) => current.map((item) => item.id === review.id ? data : item));
      setReplyDrafts((current) => ({ ...current, [String(review.id)]: data.staffReply ?? '' }));
      toast.success(data.staffReply ? 'Reply sent' : 'Reply deleted');
    } catch {
      toast.error('Could not send reply');
    } finally {
      setActiveId(null);
    }
  };

  return (
    <AdminLayout title="Review Management">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: 'text-blue-600' },
            { label: 'Visible', value: reviews.filter((review) => review.isVisible).length, icon: Eye, color: 'text-[#78ad44]' },
            { label: 'Average Rating', value: averageRating.toFixed(1), icon: Star, color: 'text-orange-500' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <item.icon size={20} className={`mb-3 ${item.color}`} />
              <p className="text-2xl font-black text-gray-900">{item.value}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex bg-[#f4f8f7] p-1 rounded-xl w-fit">
          {(['ALL', 'LOW_RATING', 'VISIBLE', 'HIDDEN'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                filter === mode ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {mode === 'ALL'
                ? 'All'
                : mode === 'LOW_RATING'
                  ? `Low Rating (${reviews.filter((review) => review.overallRating <= 3).length})`
                  : mode === 'VISIBLE'
                    ? 'Visible'
                    : 'Hidden'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading && (
            <div className="py-20 flex items-center justify-center">
              <Loader2 size={30} className="animate-spin text-[#78ad44]" />
            </div>
          )}

          {!isLoading && filteredReviews.length === 0 && (
            <div className="py-20 text-center">
              <MessageSquare size={40} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-black text-gray-900">No reviews yet</h3>
              <p className="text-sm font-bold text-gray-500 mt-2">Reviews from completed bookings will appear here.</p>
            </div>
          )}

          {!isLoading && filteredReviews.length > 0 && (
            <div className="divide-y divide-gray-100">
              {filteredReviews.map((review) => {
                const busy = activeId === review.id;
                return (
                  <div key={review.id} className={`p-5 lg:p-6 ${review.isVisible ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <ReviewStars value={review.overallRating} />
                          <span className={`px-2.5 py-1 text-[11px] font-black rounded-lg ${
                            review.isVisible ? 'bg-[#e9f2eb] text-[#78ad44]' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {review.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                          <span className="text-xs font-bold text-gray-400">{formatDateTime(review.createdAt)}</span>
                        </div>

                        <h3 className="text-base font-black text-gray-900">
                          {review.customerName || review.customerEmail || 'Customer'}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                          {review.vehicleName || `Vehicle #${review.vehicleId}`} · {review.bookingCode || `Booking #${review.bookingId}`}
                        </p>

                        <div className="grid grid-cols-3 gap-3 my-4 max-w-lg">
                          {[
                            ['Overall', review.overallRating],
                            ['Vehicle', review.vehicleRating],
                            ['Service', review.serviceRating],
                          ].map(([label, value]) => (
                            <div key={label} className="bg-[#f4f8f7] rounded-xl p-3">
                              <p className="text-[11px] font-bold text-gray-400">{label}</p>
                              <p className="text-lg font-black text-gray-900 mt-1">{value}/5</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-sm font-medium text-gray-600 leading-relaxed">
                          {review.comment || 'The customer did not leave a comment.'}
                        </p>
                      </div>

                      <div className="w-full lg:w-96 shrink-0 space-y-3">
                        <textarea
                          rows={4}
                          maxLength={500}
                          value={replyDrafts[String(review.id)] ?? ''}
                          onChange={(event) => setReplyDrafts((current) => ({
                            ...current,
                            [String(review.id)]: event.target.value,
                          }))}
                          placeholder="Reply to review..."
                          className="w-full p-4 rounded-xl bg-[#f4f8f7] border border-transparent text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleVisibility(review)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-black disabled:opacity-50"
                          >
                            {review.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                            {review.isVisible ? 'Hide Review' : 'Show Review'}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleReply(review)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#78ad44] text-white hover:bg-[#689938] text-xs font-black disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

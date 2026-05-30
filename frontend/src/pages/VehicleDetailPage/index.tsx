import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Car, Users, Settings, Briefcase, MapPin, Calendar, Check, Star, ShieldCheck, ChevronRight, Fuel, MessageSquare, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

import { MOCK_LOCATIONS } from '@/data/mockLocations';
import { MOCK_REVIEWS } from '@/data/mockReviews';
import { getCarById } from '@/services/carApi';
import { formatVND, formatDate } from '@/utils/formatters';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';
import RatingStars from '@/components/ui/RatingStars';
import { useBooking } from '@/store/bookingStore';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [vehicle, setVehicleData] = useState<DisplayVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    setVehicle,
    setStartDate: setBookingStart,
    setEndDate: setBookingEnd,
    setPickupLocation,
    setReturnLocation,
  } = useBooking();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getCarById(id);
        if (!cancelled) {
          setVehicleData(mapApiCarToDisplayVehicle(data));
        }
      } catch {
        if (!cancelled) {
          toast.error('Không tải được chi tiết xe từ backend');
          setVehicleData(null);
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

  // Reservation state
  const now = new Date();
  const defaultStart = new Date(now); defaultStart.setDate(now.getDate() + 1);
  const defaultEnd = new Date(now); defaultEnd.setDate(now.getDate() + 4);
  const minStartDate = defaultStart.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  const [pickupLoc, setPickupLoc] = useState(MOCK_LOCATIONS[0]?.id ?? 'loc-cau-giay');
  const [returnLoc, setReturnLoc] = useState(MOCK_LOCATIONS[0]?.id ?? 'loc-cau-giay');

  useEffect(() => {
    if (MOCK_LOCATIONS[0]?.id) {
      setPickupLoc(MOCK_LOCATIONS[0].id);
      setReturnLoc(MOCK_LOCATIONS[0].id);
    }
  }, [vehicle?.locationId]);

  const totalDays = useMemo(() => {
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const minEndDate = useMemo(() => {
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  }, [startDate]);

  useEffect(() => {
    if (endDate <= startDate) {
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().split('T')[0]);
    }
  }, [startDate, endDate]);

  // Reviews for this vehicle
  const reviews = useMemo(() => MOCK_REVIEWS.filter(r => r.vehicleId === id), [id]);
  const avgRating = vehicle?.avgRating ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Đang tải chi tiết xe...</div>
        <Footer />
      </div>
    );
  }

  // Rating breakdown
  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1-5 stars
    reviews.forEach(r => { if (r.overallRating >= 1 && r.overallRating <= 5) counts[r.overallRating - 1]++; });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: counts[star - 1],
      pct: Math.round((counts[star - 1] / total) * 100),
    }));
  }, [reviews]);

  // 404
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Car size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Không tìm thấy xe</h2>
            <p className="text-gray-500 mb-8">Xe bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <button onClick={() => navigate('/search')} className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg">
              Quay lại tìm xe
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      {/* Breadcrumb & Title */}
      <div className="bg-[#212529] pt-28 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 font-medium">
            <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
            <ChevronRight size={14} />
            <a href="/search" className="hover:text-white transition-colors">Danh sách xe</a>
            <ChevronRight size={14} />
            <span className="text-[#78ad44]">{vehicle.name}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <span className="inline-block px-3 py-1 bg-[#343A40] text-white text-xs font-bold rounded-lg uppercase tracking-wide mb-3">
                {vehicle.type}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{vehicle.name}</h1>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center text-[#f99200]">
                  <Star size={16} className="fill-current" />
                  <span className="ml-1 font-bold text-white">{vehicle.avgRating}</span>
                  <span className="ml-1 text-gray-400 text-sm">({vehicle.totalTrips} chuyến)</span>
                </div>
                <div className="flex items-center text-[#78ad44] text-sm font-semibold">
                  <ShieldCheck size={16} className="mr-1" /> Có bảo hiểm
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                  <Fuel size={14} className="text-[#78ad44]" />
                  <span className="text-white text-xs font-bold">{vehicle.fuelType}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-gray-400 text-sm font-medium mb-1">Giá từ</p>
              <div className="text-4xl font-black text-[#78ad44]">{formatVND(vehicle.price)}<span className="text-lg text-white font-medium">/ngày</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-20 w-full flex flex-col lg:flex-row gap-10">

        {/* Left Column */}
        <div className="flex-1 w-full flex flex-col gap-10">

          {/* Gallery */}
          <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-gray-100 flex flex-col gap-4">
            <div className="w-full h-[300px] sm:h-[400px] md:h-[450px] rounded-[1.5rem] overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={vehicle.images[activeImage]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {vehicle.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-20 sm:h-28 rounded-xl overflow-hidden ${activeImage === idx ? 'ring-2 ring-offset-2 ring-[#78ad44]' : 'opacity-70 hover:opacity-100'} transition-all`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Key Specs */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Thông số kỹ thuật</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex items-center gap-4 bg-[#f4f8f7] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#78ad44] shadow-sm"><Users size={20} /></div>
                <div><p className="text-xs text-gray-500 font-medium">Số chỗ</p><p className="font-bold text-gray-900">{vehicle.passengers} chỗ</p></div>
              </div>
              <div className="flex items-center gap-4 bg-[#f4f8f7] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#78ad44] shadow-sm"><Briefcase size={20} /></div>
                <div><p className="text-xs text-gray-500 font-medium">Hành lý</p><p className="font-bold text-gray-900">{vehicle.luggage} vali</p></div>
              </div>
              <div className="flex items-center gap-4 bg-[#f4f8f7] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#78ad44] shadow-sm"><Car size={20} /></div>
                <div><p className="text-xs text-gray-500 font-medium">Cửa xe</p><p className="font-bold text-gray-900">{vehicle.doors} cửa</p></div>
              </div>
              <div className="flex items-center gap-4 bg-[#f4f8f7] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#78ad44] shadow-sm"><Settings size={20} /></div>
                <div><p className="text-xs text-gray-500 font-medium">Hộp số</p><p className="font-bold text-gray-900">{vehicle.transmission}</p></div>
              </div>
            </div>
          </div>

          {/* Description & Features */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="mb-10">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Tổng quan</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{vehicle.description}</p>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">Tính năng nổi bật</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {vehicle.features.map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e9f2eb] text-[#78ad44] flex items-center justify-center"><Check size={14} strokeWidth={3} /></span>
                    <span className="text-gray-700 font-bold text-sm tracking-wide">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <MessageSquare size={24} className="text-[#78ad44]" /> Đánh giá
              </h3>
              <span className="text-sm font-bold text-gray-500">{reviews.length} đánh giá</span>
            </div>

            {/* Rating Overview */}
            <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-[#f4f8f7] rounded-2xl">
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-5xl font-black text-gray-900">{avgRating}</div>
                <RatingStars rating={avgRating} size={18} showValue={false} className="mt-2" />
                <p className="text-xs text-gray-500 mt-2 font-medium">{vehicle.totalTrips} chuyến</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingBreakdown.map(item => (
                  <div key={item.star} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600 w-6 text-right">{item.star}★</span>
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#f99200] rounded-full transition-all" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 w-10">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-6">
              {reviews.length === 0 && (
                <p className="text-center text-gray-400 py-8 font-medium">Chưa có đánh giá nào cho xe này.</p>
              )}
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-none last:pb-0">
                  <div className="flex items-start gap-4">
                    <img src={review.customerAvatar} alt={review.customerName} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900">{review.customerName}</h4>
                        <span className="text-xs text-gray-400 font-medium">{formatDate(review.createdAt)}</span>
                      </div>
                      <RatingStars rating={review.overallRating} size={14} showValue={false} className="mb-2" />
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">{review.comment}</p>
                      <button className="flex items-center gap-1.5 mt-3 text-xs font-bold text-gray-400 hover:text-[#78ad44] transition-colors">
                        <ThumbsUp size={13} /> Hữu ích
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reservation */}
        <aside className="w-full lg:w-[400px] shrink-0">
          <div className="sticky top-24 bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 flex flex-col gap-6">
            <h3 className="text-2xl font-black text-gray-900 border-b border-gray-100 pb-4">Đặt xe</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 ml-2 mb-1.5 block">Nhận xe tại</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={pickupLoc}
                    onChange={e => setPickupLoc(e.target.value)}
                    className="w-full bg-[#f4f8f7] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                  >
                    {MOCK_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 ml-2 mb-1.5 block">Trả xe tại</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={returnLoc}
                    onChange={e => setReturnLoc(e.target.value)}
                    className="w-full bg-[#f4f8f7] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                  >
                    {MOCK_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 mb-1.5 block">Ngày nhận</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    <input
                      type="date" value={startDate}
                      min={minStartDate}
                      onChange={e => setStartDate(e.target.value)}
                      onClick={e => e.currentTarget.showPicker()}
                      className="w-full bg-[#f4f8f7] border-none rounded-2xl pl-12 pr-3 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium cursor-pointer [color-scheme:light]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 mb-1.5 block">Ngày trả</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    <input
                      type="date" value={endDate}
                      min={minEndDate}
                      onChange={e => setEndDate(e.target.value)}
                      onClick={e => e.currentTarget.showPicker()}
                      className="w-full bg-[#f4f8f7] border-none rounded-2xl pl-12 pr-3 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium cursor-pointer [color-scheme:light]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price calc */}
            <div className="border-t border-gray-100 pt-6 mt-2">
              <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
                <span>Đơn giá</span>
                <span>{formatVND(vehicle.price)}/ngày</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
                <span>Số ngày thuê</span>
                <span>{totalDays} ngày</span>
              </div>
              <div className="flex justify-between items-center text-lg font-black text-gray-900 mt-6 bg-[#f4f8f7] p-4 rounded-xl">
                <span>Tạm tính</span>
                <span className="text-[#78ad44]">{formatVND(vehicle.price * totalDays)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setVehicle(vehicle);
                setBookingStart(startDate);
                setBookingEnd(endDate);
                setPickupLocation(pickupLoc);
                setReturnLocation(returnLoc);
                navigate(`/booking/${vehicle.id}`);
              }}
              className="w-full bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg mt-2 flex justify-center items-center gap-2"
            >
              Tiếp tục đặt xe <ChevronRight size={18} />
            </button>
            <p className="text-xs text-center text-gray-400 font-medium">Bạn chưa bị tính phí</p>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

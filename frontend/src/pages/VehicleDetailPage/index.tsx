import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import {
  Car, Users, Settings, Briefcase, MapPin, Calendar, Check, Star,
  ShieldCheck, ChevronRight, Fuel, MessageSquare, ThumbsUp,
  CreditCard, Hash, Building2, CalendarDays, Gauge, Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { MOCK_LOCATIONS } from '@/data/mockLocations';
import { MOCK_REVIEWS } from '@/data/mockReviews';
import { getCarById } from '@/services/carApi';
import { formatVND, formatDate } from '@/utils/formatters';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';
import {
  clampDateTimeLocalValue,
  combineDateAndTimeParts,
  ensureFutureEndDateTime,
  getDefaultBookingRange,
  getDurationDays,
  getDurationHours,
  getDurationLabel,
  inferPricingMode,
  splitDateTimeLocalValue,
  TIME_OPTIONS_24H,
} from '@/utils/bookingDateTime';
import RatingStars from '@/components/ui/RatingStars';
import { useBooking } from '@/store/bookingStore';

const STATUS_META = {
  AVAILABLE: { label: 'Sẵn sàng cho thuê', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  MAINTENANCE: { label: 'Đang bảo dưỡng', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  RETIRED: { label: 'Ngừng hoạt động', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
};

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
      if (!id) { setIsLoading(false); return; }
      try {
        const { data } = await getCarById(id);
        if (!cancelled) setVehicleData(mapApiCarToDisplayVehicle(data));
      } catch {
        if (!cancelled) {
          toast.error('Không tải được chi tiết xe từ backend');
          setVehicleData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id]);

  const initialRange = useMemo(() => getDefaultBookingRange(), []);
  const minStartDate = initialRange.startDate;

  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [pickupLoc, setPickupLoc] = useState(MOCK_LOCATIONS[0]?.id ?? 'loc-cau-giay');
  const [returnLoc, setReturnLoc] = useState(MOCK_LOCATIONS[0]?.id ?? 'loc-cau-giay');

  useEffect(() => {
    if (MOCK_LOCATIONS[0]?.id) {
      setPickupLoc(MOCK_LOCATIONS[0].id);
      setReturnLoc(MOCK_LOCATIONS[0].id);
    }
  }, [vehicle?.locationId]);

  const pricingMode = useMemo(() => inferPricingMode(startDate, endDate), [startDate, endDate]);
  const totalHours = useMemo(() => getDurationHours(startDate, endDate), [startDate, endDate]);
  const totalDays = useMemo(() => getDurationDays(startDate, endDate), [startDate, endDate]);
  const durationLabel = useMemo(() => getDurationLabel(startDate, endDate, pricingMode), [startDate, endDate, pricingMode]);
  const unitRateAmount = useMemo(
    () => pricingMode === 'HOURLY' ? Math.round((vehicle?.price ?? 0) / 24) : (vehicle?.price ?? 0),
    [pricingMode, vehicle?.price],
  );
  const estimatedTotal = unitRateAmount * (pricingMode === 'HOURLY' ? totalHours : totalDays);

  const minEndDate = useMemo(() => ensureFutureEndDateTime(startDate, startDate), [startDate]);

  useEffect(() => {
    const safeEnd = ensureFutureEndDateTime(startDate, endDate);
    if (safeEnd !== endDate) setEndDate(safeEnd);
  }, [startDate, endDate]);

  const reviews = useMemo(() => MOCK_REVIEWS.filter(r => r.vehicleId === id), [id]);
  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.overallRating >= 1 && r.overallRating <= 5) counts[r.overallRating - 1]++; });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map(star => ({
      star, count: counts[star - 1],
      pct: Math.round((counts[star - 1] / total) * 100),
    }));
  }, [reviews]);

  const formatBookingDateLabel = (value: string) => {
    const { datePart } = splitDateTimeLocalValue(value);
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  const updateBookingDateTime = (current: string, nextDate: string, nextTime: string, min?: string) => {
    const fallback = splitDateTimeLocalValue(current).datePart;
    return clampDateTimeLocalValue(combineDateAndTimeParts(nextDate || fallback, nextTime), min);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Đang tải chi tiết xe...</div>
        <Footer />
      </div>
    );
  }

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

  const statusMeta = STATUS_META[vehicle.backendStatus ?? 'AVAILABLE'];
  const canBook = vehicle.backendStatus === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      {/* Hero Banner */}
      <div className="bg-[#212529] pt-28 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 font-medium">
            <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
            <ChevronRight size={14} />
            <a href="/search" className="hover:text-white transition-colors">Danh sách xe</a>
            <ChevronRight size={14} />
            <span className="text-[#78ad44]">{vehicle.name}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="px-3 py-1 bg-[#343A40] text-white text-xs font-bold rounded-lg uppercase tracking-wide">
                  {vehicle.type}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${statusMeta.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.label}
                </span>
                {vehicle.licensePlate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg tracking-widest">
                    <Hash size={11} />
                    {vehicle.licensePlate}
                  </span>
                )}
              </div>

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
                {vehicle.branchName && (
                  <div className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                    <Building2 size={14} className="text-gray-500" />
                    {vehicle.branchName}
                  </div>
                )}
              </div>
            </div>

            <div className="text-left md:text-right shrink-0">
              <p className="text-gray-400 text-sm font-medium mb-1">Giá thuê</p>
              <div className="text-4xl font-black text-[#78ad44]">
                {formatVND(vehicle.price)}
                <span className="text-lg text-white font-medium">/ngày</span>
              </div>
              {vehicle.deposit != null && vehicle.deposit > 0 && (
                <p className="text-gray-400 text-sm font-medium mt-1">
                  Cọc: <span className="text-white font-bold">{formatVND(vehicle.deposit)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-20 w-full flex flex-col lg:flex-row gap-10">

        {/* ── Left Column ── */}
        <div className="order-2 lg:order-1 flex-1 w-full flex flex-col gap-8">

          {/* Gallery */}
          <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-gray-100 flex flex-col gap-4">
            <div className="w-full h-[300px] sm:h-[400px] md:h-[450px] rounded-[1.5rem] overflow-hidden relative bg-gray-100">
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
            {vehicle.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 rounded-xl overflow-hidden transition-all ${
                      activeImage === idx ? 'ring-2 ring-offset-2 ring-[#78ad44]' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Info Cards */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Info size={20} className="text-[#78ad44]" /> Thông tin xe
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoCard icon={<Hash size={18} />} label="Biển số xe" value={vehicle.licensePlate ?? 'Chưa cập nhật'} highlight />
              <InfoCard icon={<CalendarDays size={18} />} label="Năm sản xuất" value={vehicle.year ? `${vehicle.year}` : 'Chưa cập nhật'} />
              <InfoCard icon={<Gauge size={18} />} label="Loại xe" value={vehicle.type} />
              <InfoCard icon={<Users size={18} />} label="Số chỗ ngồi" value={`${vehicle.passengers} chỗ`} />
              <InfoCard icon={<Settings size={18} />} label="Hộp số" value={vehicle.transmission} />
              <InfoCard icon={<Fuel size={18} />} label="Nhiên liệu" value={vehicle.fuelType} />
              <InfoCard icon={<Car size={18} />} label="Số cửa" value={`${vehicle.doors} cửa`} />
              <InfoCard icon={<Briefcase size={18} />} label="Hành lý" value={`${vehicle.luggage} vali`} />
              {vehicle.branchName && (
                <InfoCard icon={<Building2 size={18} />} label="Chi nhánh" value={vehicle.branchName} />
              )}
            </div>
          </div>

          {/* Pricing Detail */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-[#78ad44]" /> Chi phí thuê xe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#f4f8f7] rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#78ad44] rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Giá thuê / ngày</p>
                  <p className="text-2xl font-black text-gray-900">{formatVND(vehicle.price)}</p>
                </div>
              </div>
              {vehicle.deposit != null && vehicle.deposit > 0 && (
                <div className="bg-[#fff8f0] rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-400 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Tiền đặt cọc</p>
                    <p className="text-2xl font-black text-gray-900">{formatVND(vehicle.deposit)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Hoàn lại sau khi trả xe</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500 font-medium flex items-start gap-2">
              <Info size={15} className="shrink-0 mt-0.5 text-gray-400" />
              Giá đã bao gồm bảo hiểm cơ bản. Tiền cọc được hoàn trả đầy đủ sau khi trả xe đúng hạn và không có hư hỏng.
            </div>
          </div>

          {/* Description & Features */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="mb-10">
              <h3 className="text-2xl font-black text-gray-900 mb-4">Mô tả xe</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{vehicle.description}</p>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-5">Trang bị & tiện nghi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {vehicle.features.map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e9f2eb] text-[#78ad44] flex items-center justify-center shrink-0">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-gray-700 font-bold text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          {vehicle.branchName && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 mb-5 flex items-center gap-2">
                <MapPin size={20} className="text-[#78ad44]" /> Vị trí xe
              </h3>
              <div className="flex items-center gap-4 bg-[#f4f8f7] rounded-2xl p-5">
                <div className="w-12 h-12 bg-[#78ad44] rounded-xl flex items-center justify-center shrink-0">
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{vehicle.branchName}</p>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">Nhận xe trực tiếp tại chi nhánh</p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <MessageSquare size={22} className="text-[#78ad44]" /> Đánh giá
              </h3>
              <span className="text-sm font-bold text-gray-500">{reviews.length} đánh giá</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-[#f4f8f7] rounded-2xl">
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-5xl font-black text-gray-900">{vehicle.avgRating}</div>
                <RatingStars rating={vehicle.avgRating} size={18} showValue={false} className="mt-2" />
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

        {/* ── Right Column: Booking ── */}
        <aside className="order-1 lg:order-2 w-full lg:w-[400px] shrink-0">
          <div className="sticky top-24 bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-2xl font-black text-gray-900">Đặt xe</h3>
              {!canBook && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  Không khả dụng
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 ml-2 mb-1.5 block">Nhận xe tại</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={pickupLoc}
                    onChange={e => setPickupLoc(e.target.value)}
                    disabled={!canBook}
                    className="w-full bg-[#f4f8f7] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium appearance-none cursor-pointer disabled:opacity-60"
                  >
                    {MOCK_LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
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
                    disabled={!canBook}
                    className="w-full bg-[#f4f8f7] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium appearance-none cursor-pointer disabled:opacity-60"
                  >
                    {MOCK_LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date pickers */}
              {(['start', 'end'] as const).map(type => {
                const isStart = type === 'start';
                const value = isStart ? startDate : endDate;
                const minVal = isStart ? minStartDate : minEndDate;
                const setter = isStart ? setStartDate : setEndDate;
                return (
                  <div key={type}>
                    <label className="text-xs font-bold text-gray-700 ml-2 mb-1.5 block">
                      {isStart ? 'Ngày nhận xe' : 'Ngày trả xe'}
                    </label>
                    <div className="relative bg-[#f4f8f7] rounded-2xl pl-12 pr-3 py-2.5 flex items-center gap-3">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <div className="relative min-w-0 flex-1">
                        <div className="truncate text-sm text-gray-700 font-medium leading-5">
                          {formatBookingDateLabel(value)}
                        </div>
                        <input
                          type="date"
                          value={splitDateTimeLocalValue(value).datePart}
                          min={splitDateTimeLocalValue(minVal).datePart}
                          disabled={!canBook}
                          onChange={e => setter(updateBookingDateTime(value, e.target.value, splitDateTimeLocalValue(value).timePart, minVal))}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                      <select
                        value={splitDateTimeLocalValue(value).timePart}
                        disabled={!canBook}
                        onChange={e => setter(updateBookingDateTime(value, splitDateTimeLocalValue(value).datePart, e.target.value, minVal))}
                        className="w-24 rounded-xl bg-white px-3 py-2 text-sm focus:outline-none text-gray-700 font-semibold appearance-none cursor-pointer text-center shadow-sm disabled:opacity-60"
                      >
                        {TIME_OPTIONS_24H.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Summary */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <div className="flex justify-between text-sm font-bold text-gray-600">
                <span>Đơn giá</span>
                <span>{formatVND(unitRateAmount)}/{pricingMode === 'HOURLY' ? 'giờ' : 'ngày'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-600">
                <span>Thời lượng</span>
                <span>{durationLabel}</span>
              </div>
              {vehicle.deposit != null && vehicle.deposit > 0 && (
                <div className="flex justify-between text-sm font-bold text-gray-600">
                  <span>Tiền cọc</span>
                  <span className="text-orange-500">{formatVND(vehicle.deposit)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-black text-gray-900 bg-[#f4f8f7] px-4 py-3 rounded-xl mt-2">
                <span>Tạm tính</span>
                <span className="text-[#78ad44]">{formatVND(estimatedTotal)}</span>
              </div>
            </div>

            <button
              disabled={!canBook}
              onClick={() => {
                setVehicle(vehicle);
                setBookingStart(startDate);
                setBookingEnd(endDate);
                setPickupLocation(pickupLoc);
                setReturnLocation(returnLoc);
                navigate(`/booking/${vehicle.id}`);
              }}
              className="w-full bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl py-4 transition-colors shadow-lg flex justify-center items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {canBook ? (
                <><span>Tiếp tục đặt xe</span><ChevronRight size={18} /></>
              ) : (
                <span>Xe hiện không khả dụng</span>
              )}
            </button>
            <p className="text-xs text-center text-gray-400 font-medium">Bạn chưa bị tính phí ở bước này</p>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

function InfoCard({ icon, label, value, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-4 ${highlight ? 'bg-[#212529]' : 'bg-[#f4f8f7]'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${highlight ? 'bg-white/10 text-[#78ad44]' : 'bg-white text-[#78ad44] shadow-sm'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium mb-0.5 ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        <p className={`font-bold text-sm truncate ${highlight ? 'text-white tracking-widest' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

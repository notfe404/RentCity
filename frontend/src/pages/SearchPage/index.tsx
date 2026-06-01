import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, MapPin, Filter, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import DateTime24hField from '@/components/ui/DateTime24hField';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { useDebounce } from '@/hooks/useDebounce';
import { getAvailableCars } from '@/services/carApi';
import { useBooking } from '@/store/bookingStore';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';
import {
  ensureFutureEndDateTime,
  getDefaultBookingRange,
  getMinimumEndDateTime,
  toBackendDateTime,
} from '@/utils/bookingDateTime';
import { formatVND } from '@/utils/formatters';

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'trips';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Đề xuất' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'trips', label: 'Nhiều chuyến nhất' },
];

const CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Van'];
const SEAT_OPTIONS = [4, 5, 7];
const FUEL_OPTIONS = ['Xăng', 'Dầu diesel', 'Điện', 'Hybrid'] as const;
const TRANSMISSION_OPTIONS = ['Số tự động', 'Số sàn'] as const;

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<DisplayVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    setVehicle,
    setStartDate: setBookingStartDate,
    setEndDate: setBookingEndDate,
    setPickupLocation,
    setReturnLocation,
  } = useBooking();

  // Filters
  const [priceRange, setPriceRange] = useState(3000000);
  const debouncedPrice = useDebounce(priceRange, 300);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<string[]>([]);
  const [selectedTransmission, setSelectedTransmission] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const initialRange = useMemo(() => getDefaultBookingRange(), []);
  const [searchStart, setSearchStart] = useState(initialRange.startDate);
  const [searchEnd, setSearchEnd] = useState(initialRange.endDate);

  const brandFilter = searchParams.get('brand');
  const categoryFilter = searchParams.get('category');
  const minStartDate = initialRange.startDate;
  const minReturnDate = useMemo(() => {
    return getMinimumEndDateTime(searchStart);
  }, [searchStart]);

  useEffect(() => {
    const safeEnd = ensureFutureEndDateTime(searchStart, searchEnd);
    if (safeEnd !== searchEnd) {
      setSearchEnd(safeEnd);
    }
  }, [searchStart, searchEnd]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (new Date(searchStart).getTime() >= new Date(searchEnd).getTime()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data } = await getAvailableCars({
          from: toBackendDateTime(searchStart),
          to: toBackendDateTime(searchEnd),
          ...(selectedLocation ? { branchId: Number(selectedLocation) } : {}),
        });
        if (!cancelled) {
          setVehicles(data.map(mapApiCarToDisplayVehicle));
        }
      } catch {
        if (!cancelled) {
          toast.error('Không tải được danh sách xe');
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
  }, [searchStart, searchEnd, selectedLocation]);

  // Toggle helpers
  const toggleFilter = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };
  const toggleSeatFilter = (val: number) => {
    setSelectedSeats(s => s.includes(val) ? s.filter(v => v !== val) : [...s, val]);
  };

  const activeFilterCount = selectedCategories.length + selectedSeats.length + selectedFuel.length + selectedTransmission.length + (selectedLocation ? 1 : 0);

  // Filter + Sort
  const filteredVehicles = useMemo(() => {
    let results = vehicles.filter(car => {
      if (brandFilter && car.brand.toLowerCase() !== brandFilter.toLowerCase()) return false;
      if (categoryFilter && !car.type.toLowerCase().includes(categoryFilter.toLowerCase()) && !car.category?.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
      if (car.price > debouncedPrice) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(car.category)) return false;
      if (selectedSeats.length > 0 && !selectedSeats.includes(car.passengers)) return false;
      if (selectedFuel.length > 0 && !selectedFuel.includes(car.fuelType)) return false;
      if (selectedTransmission.length > 0 && !selectedTransmission.includes(car.transmission)) return false;
      if (selectedLocation && car.locationId !== selectedLocation) return false;
      return true;
    });

    switch (sortBy) {
      case 'price-asc': results.sort((a, b) => a.price - b.price); break;
      case 'price-desc': results.sort((a, b) => b.price - a.price); break;
      case 'rating': results.sort((a, b) => b.avgRating - a.avgRating); break;
      case 'trips': results.sort((a, b) => b.totalTrips - a.totalTrips); break;
    }
    return results;
  }, [brandFilter, categoryFilter, debouncedPrice, selectedCategories, selectedSeats, selectedFuel, selectedTransmission, selectedLocation, sortBy, vehicles]);

  const locationOptions = useMemo(() => {
    const seen = new Map<string, string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.locationId && vehicle.branchName) {
        seen.set(vehicle.locationId, vehicle.branchName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [vehicles]);

  const handleDetailsClick = useCallback((id: string) => navigate(`/vehicles/${id}`), [navigate]);
  const handleBookClick = useCallback((id: string) => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === id);
    if (selectedVehicle) {
      setVehicle(selectedVehicle);
      setBookingStartDate(searchStart);
      setBookingEndDate(searchEnd);
      const pickupId = selectedVehicle.locationId || selectedLocation || 'loc-02';
      setPickupLocation(pickupId);
      setReturnLocation(pickupId);
    }
    navigate(`/booking/${id}`);
  }, [
    navigate,
    vehicles,
    searchStart,
    searchEnd,
    selectedLocation,
    setVehicle,
    setBookingStartDate,
    setBookingEndDate,
    setPickupLocation,
    setReturnLocation,
  ]);

  const clearAllFilters = () => {
    setPriceRange(3000000);
    setSelectedCategories([]);
    setSelectedSeats([]);
    setSelectedFuel([]);
    setSelectedTransmission([]);
    setSelectedLocation('');
    const freshRange = getDefaultBookingRange();
    setSearchStart(freshRange.startDate);
    setSearchEnd(freshRange.endDate);
    navigate('/search');
  };

  // ─── Filter Sidebar Content (reused for desktop & mobile) ───
  const filterContent = (
    <div className="space-y-8">
      {/* Location */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 block">Chi nhánh</h4>
        <select
          value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}
          className="w-full bg-[#f4f8f7] rounded-xl py-3 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#78ad44] border-none appearance-none cursor-pointer"
        >
          <option value="">Tất cả chi nhánh</option>
          {locationOptions.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-4 flex justify-between">
          <span>Giá tối đa</span>
          <span className="text-[#78ad44]">{formatVND(priceRange)}/ngày</span>
        </label>
        <input
          type="range" min={500000} max={3000000} step={50000}
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#78ad44]"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
          <span>500K</span><span>3M</span>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 block">Danh mục</h4>
        <div className="space-y-3">
          {CATEGORIES.map(c => (
            <label key={c} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(c)}
                onChange={() => toggleFilter(selectedCategories, c, setSelectedCategories)}
                className="w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44] cursor-pointer"
              />
              <span className="text-gray-600 group-hover:text-gray-900 text-sm font-medium">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Seats */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 block">Số ghế</h4>
        <div className="flex gap-2">
          {SEAT_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleSeatFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedSeats.includes(s)
                  ? 'bg-[#78ad44] text-white shadow-md'
                  : 'bg-[#f4f8f7] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s} chỗ
            </button>
          ))}
        </div>
      </div>

      {/* Fuel */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 block">Nhiên liệu</h4>
        <div className="space-y-3">
          {FUEL_OPTIONS.map(f => (
            <label key={f} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFuel.includes(f)}
                onChange={() => toggleFilter(selectedFuel, f, setSelectedFuel)}
                className="w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44] cursor-pointer"
              />
              <span className="text-gray-600 group-hover:text-gray-900 text-sm font-medium">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 block">Hộp số</h4>
        <div className="space-y-3">
          {TRANSMISSION_OPTIONS.map(t => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedTransmission.includes(t)}
                onChange={() => toggleFilter(selectedTransmission, t, setSelectedTransmission)}
                className="w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44] cursor-pointer"
              />
              <span className="text-gray-600 group-hover:text-gray-900 text-sm font-medium">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button onClick={clearAllFilters} className="w-full py-3 text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
          Xóa tất cả bộ lọc ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      {/* Top Search Bar */}
      <div className="bg-[#212529] pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-8 tracking-tight">
            {brandFilter ? `Bộ sưu tập ${brandFilter}` : categoryFilter ? `Xe ${categoryFilter}` : 'Tìm xe phù hợp cho bạn'}
          </h1>

          {(brandFilter || categoryFilter) && (
            <button
              onClick={() => navigate('/search')}
              className="mb-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 w-fit"
            >
              Xóa bộ lọc: <span className="text-[#78ad44]">{brandFilter || categoryFilter}</span> ✕
            </button>
          )}

          <div className="bg-white rounded-[2rem] p-4 flex flex-col lg:grid lg:grid-cols-12 gap-4 items-end shadow-2xl">
            {/* Location */}
            <div className="lg:col-span-3 w-full relative group">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-[#78ad44]" size={20} />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="w-full bg-[#f4f8f7] rounded-full py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-[#78ad44] text-gray-700 font-bold text-sm appearance-none cursor-pointer"
              >
                <option value="">Tất cả chi nhánh</option>
                {locationOptions.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Pickup date */}
            <div className="lg:col-span-4 w-full flex bg-[#f4f8f7] rounded-full border border-transparent hover:border-gray-200 transition-all overflow-hidden relative">
              <DateTime24hField
                value={searchStart}
                min={minStartDate}
                onChange={setSearchStart}
                containerClassName="flex-1 relative flex items-center"
                controlsClassName="w-full pl-12 pr-2 flex items-center gap-2"
                dateInputClassName="min-w-0 flex-1 bg-transparent py-4 focus:outline-none text-gray-700 text-sm font-bold [color-scheme:light]"
                timeSelectClassName="w-24 bg-transparent py-4 pr-1 focus:outline-none text-gray-700 text-sm font-bold appearance-none cursor-pointer text-right"
                iconClassName="absolute left-5 top-1/2 -translate-y-1/2 text-[#78ad44] pointer-events-none"
              />
              <div className="w-[1px] bg-gray-200 my-3" />
              <div className="w-28 flex items-center justify-center text-sm font-bold text-gray-500 px-3">
                Nhận xe
              </div>
            </div>

            {/* Return date */}
            <div className="lg:col-span-4 w-full flex bg-[#f4f8f7] rounded-full border border-transparent hover:border-gray-200 transition-all overflow-hidden relative">
              <DateTime24hField
                value={searchEnd}
                min={minReturnDate}
                onChange={setSearchEnd}
                containerClassName="flex-1 relative flex items-center"
                controlsClassName="w-full pl-12 pr-2 flex items-center gap-2"
                dateInputClassName="min-w-0 flex-1 bg-transparent py-4 focus:outline-none text-gray-700 text-sm font-bold [color-scheme:light]"
                timeSelectClassName="w-24 bg-transparent py-4 pr-1 focus:outline-none text-gray-700 text-sm font-bold appearance-none cursor-pointer text-right"
                iconClassName="absolute left-5 top-1/2 -translate-y-1/2 text-[#78ad44] pointer-events-none"
              />
              <div className="w-[1px] bg-gray-200 my-3" />
              <div className="w-28 flex items-center justify-center text-sm font-bold text-gray-500 px-3">
                Trả xe
              </div>
            </div>

            <button className="lg:col-span-1 w-full bg-[#78ad44] hover:bg-[#689938] text-white p-4 rounded-full font-bold transition-all shadow-md flex items-center justify-center shrink-0">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-10 w-full flex-1">

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden flex items-center gap-2 bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 font-bold text-sm text-gray-700 w-fit"
        >
          <SlidersHorizontal size={16} /> Bộ lọc {activeFilterCount > 0 && <span className="bg-[#78ad44] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeFilterCount}</span>}
        </button>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden overflow-y-auto p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X size={20} />
                  </button>
                </div>
                {filterContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
              <Filter size={18} className="text-gray-400" />
            </div>
            {filterContent}
          </div>
        </aside>

        {/* Vehicle Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-500 font-medium">
              Hiển thị <span className="text-gray-900 font-bold">{filteredVehicles.length}</span> xe
            </p>
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(o => !o)}
                className="flex items-center gap-2 font-bold text-gray-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-sm"
              >
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label} <ChevronDown size={16} />
              </button>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden w-48">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#f4f8f7] transition-colors ${sortBy === opt.value ? 'text-[#78ad44] font-bold' : 'text-gray-700'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 text-gray-500 font-bold"
                >
                  Đang tải xe...
                </motion.div>
              )}
              {!isLoading && filteredVehicles.map((car) => (
                <motion.div
                  key={car.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <VehicleCard
                    car={car}
                    onDetailsClick={handleDetailsClick}
                    onBookClick={handleBookClick}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!isLoading && filteredVehicles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 mt-8"
              >
                <div className="w-20 h-20 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-[#78ad44]">
                  <Search size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy xe</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Không có xe nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh hoặc xóa bộ lọc.</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#78ad44]/20"
                >
                  Xóa tất cả bộ lọc
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
}

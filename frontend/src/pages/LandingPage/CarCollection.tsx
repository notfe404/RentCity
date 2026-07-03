import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { searchCars } from '@/services/carApi';
import { formatVND } from '@/utils/formatters';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';

const TABS = ['Featured', 'Sedan', 'SUV', 'Van', 'Luxury'];

export default function CarCollection() {
  const [activeTab, setActiveTab] = useState('Featured');
  const [vehicles, setVehicles] = useState<DisplayVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      setIsLoading(true);
      try {
        const { data } = await searchCars({
          page: 0,
          size: 12,
          status: 'AVAILABLE',
        });

        if (!cancelled) {
          setVehicles(data.content.map(mapApiCarToDisplayVehicle));
        }
      } catch {
        if (!cancelled) {
          setVehicles([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  const shownVehicles = useMemo(() => {
    const filtered = activeTab === 'Featured'
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.type === activeTab);

    return (filtered.length > 0 ? filtered : vehicles).slice(0, 6);
  }, [activeTab, vehicles]);

  const cheapestPrice = vehicles.length > 0
    ? Math.min(...vehicles.map((vehicle) => vehicle.price))
    : null;

  const handleDetailsClick = (id: string) => navigate(`/vehicles/${id}`);
  const handleBookClick = (id: string) => navigate(`/vehicles/${id}`);

  return (
    <section className="bg-[#f4f5f6] py-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Our Impressive Collection of Cars
          </h2>
          <p className="text-gray-900 max-w-2xl mx-auto text-[13px] font-medium leading-relaxed">
            Real vehicles from our RentCity fleet, ready for city trips, family travel, and premium rentals.
            {cheapestPrice !== null && (
              <span className="block mt-1 text-[#78ad44] font-black">
                From {formatVND(cheapestPrice)} per day
              </span>
            )}
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                activeTab === tab
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-3xl p-4 shadow-sm animate-pulse">
                <div className="h-56 rounded-2xl bg-gray-100 mb-4" />
                <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
                <div className="h-12 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : shownVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {shownVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                car={vehicle}
                onDetailsClick={handleDetailsClick}
                onBookClick={handleBookClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center mb-12">
            <h3 className="text-xl font-black text-gray-900 mb-2">No vehicles available</h3>
            <p className="text-sm text-gray-500">Please check the vehicle list again after the fleet is updated.</p>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-xs font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            See all Cars <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

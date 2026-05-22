import React from 'react';
import { Car, Users, Settings, Briefcase, Fuel, Star, MapPin } from 'lucide-react';
import { formatVND } from '@/utils/formatters';
import type { MockVehicle } from '@/data/mockVehicles';

interface VehicleCardProps {
  car: MockVehicle;
  onDetailsClick: (id: string) => void;
  onBookClick: (id: string) => void;
}

export const VehicleCard = React.memo<VehicleCardProps>(({ car, onDetailsClick, onBookClick }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer">

      {/* Car Image */}
      <div className="relative h-56 bg-[#f4f8f7] p-6 overflow-hidden flex items-center justify-center">
        <img
          src={car.image}
          alt={car.name}
          loading="lazy"
          className="w-full h-full object-cover rounded-xl mt-4 group-hover:scale-105 transition-transform duration-500 shadow-md"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 justify-center flex items-center font-bold text-sm rounded-full text-[#78ad44] shadow-sm">
          {formatVND(car.price)} <span className="text-gray-400 text-xs ml-1 font-medium">/ ngày</span>
        </div>
        {/* Fuel type badge */}
        <div className="absolute top-4 left-4 bg-[#212529]/80 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
          <Fuel size={12} className="text-[#78ad44]" />
          <span className="text-white text-[10px] font-bold">{car.fuelType}</span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{car.type}</p>
            <div className="flex items-center gap-1">
              <Star size={13} className="text-[#f99200] fill-current" />
              <span className="text-xs font-bold text-gray-700">{car.avgRating}</span>
              <span className="text-[10px] text-gray-400">({car.totalTrips})</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 line-clamp-1">{car.name}</h3>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-start text-xs font-semibold text-gray-600 gap-2">
            <Users size={16} className="text-[#78ad44]" /> {car.passengers} chỗ
          </div>
          <div className="flex items-center justify-start text-xs font-semibold text-gray-600 gap-2">
            <Briefcase size={16} className="text-[#78ad44]" /> {car.luggage} hành lý
          </div>
          <div className="flex items-center justify-start text-xs font-semibold text-gray-600 gap-2">
            <Car size={16} className="text-[#78ad44]" /> {car.doors} cửa
          </div>
          <div className="flex items-center justify-start text-xs font-semibold text-gray-600 gap-2">
            <Settings size={16} className="text-[#78ad44]" /> {car.transmission}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-3">
          <button
            onClick={() => onDetailsClick(car.id)}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-full font-bold text-sm tracking-wide hover:border-[#78ad44] hover:text-[#78ad44] transition-colors"
          >
            Chi tiết
          </button>
          <button
            onClick={() => onBookClick(car.id)}
            className="flex-1 bg-[#212529] text-white py-3 rounded-full font-bold text-sm tracking-wide hover:bg-[#78ad44] transition-colors shadow-lg"
          >
            Đặt ngay
          </button>
        </div>
      </div>

    </div>
  );
});

VehicleCard.displayName = 'VehicleCard';

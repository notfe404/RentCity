
import { ArrowRight, Settings, Users, Fuel } from 'lucide-react';

interface CarCardProps {
  name: string;
  price: number;
  image: string;
  type: string;
  passengers: number;
  transmission: string;
  fuel: string;
}

const CarCard = ({ name, price, image, type, passengers, transmission, fuel }: CarCardProps) => {
  return (
    <div className="group bg-graphite rounded-3xl overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col h-full">
      <div className="relative aspect-[16/10] overflow-hidden p-4">
        <div className="absolute inset-0 bg-gradient-to-t from-graphite to-transparent z-10" />
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-contain object-bottom relative z-20 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 z-30 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">{type}</span>
        </div>
      </div>
      
      <div className="p-6 pt-2 flex flex-col flex-grow relative z-30">
        <h3 className="text-xl font-bold mb-1 truncate">{name}</h3>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-2xl font-bold text-gold">${price.toFixed(2)}</span>
          <span className="text-sm text-gray-400">/ day</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 border-y border-white/5 py-4">
          <div className="flex flex-col items-center gap-1">
            <Users size={18} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-medium">{passengers} Seats</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-white/5">
            <Settings size={18} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-medium">{transmission}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Fuel size={18} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-medium">{fuel}</span>
          </div>
        </div>

        <button className="mt-auto w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 border border-white/10 group-hover:bg-gold group-hover:text-deepBlack group-hover:border-gold">
          <span>Rent Now</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CarCard;

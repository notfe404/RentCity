import { useState } from 'react';
import { MapPin, Settings, Users, Fuel, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TABS = ['Popular Car', 'Luxury Car', 'Vintage Car', 'Family Car', 'Off-Road Car'];

const CARS = [
  {
    id: '1',
    name: 'Audi A8 L 2022',
    price: 78.90,
    seats: 5,
    fuel: '1.2L',
    transmission: 'Auto',
    miles: '4.8k',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop',
    category: 'Luxury Car',
  },
  {
    id: '2',
    name: 'Nissan Maxima Platinum 2022',
    price: 78.90,
    seats: 5,
    fuel: '1.2L',
    transmission: 'Auto',
    miles: '4.8k',
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=600&auto=format&fit=crop',
    category: 'Popular Car',
    isMiddle: true, // Specific highlight to match design (solid black button)
  },
  {
    id: '3',
    name: 'Porsche Cayenne GTS 2022',
    price: 78.90,
    seats: 5,
    fuel: '1.2L',
    transmission: 'Auto',
    miles: '4.8k',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
    category: 'Luxury Car',
  },
  {
    id: '4',
    name: 'BMW M8 Coupe 2022',
    price: 78.90,
    seats: 4,
    fuel: '1.2L',
    transmission: 'Auto',
    miles: '4.8k',
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=600&auto=format&fit=crop',
    category: 'Popular Car',
  },
  {
    id: '5',
    name: 'BMW X7 M60i 2022',
    price: 78.90,
    seats: 7,
    fuel: '1.2L',
    transmission: 'Auto',
    miles: '4.8k',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600&auto=format&fit=crop',
    category: 'Family Car',
  },
  {
    id: '6',
    name: 'Porsche Cayenne GTS 2023',
    price: 78.90,
    seats: 5,
    fuel: '1.2L',
    transmission: 'Auto',
    miles: '4.8k',
    image: 'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?q=80&w=600&auto=format&fit=crop',
    category: 'Off-Road Car',
  },
];

export default function CarCollection() {
  const [activeTab, setActiveTab] = useState('Popular Car');
  const navigate = useNavigate();

  const display = activeTab === 'Popular Car' ? CARS : CARS.filter(c => c.category === activeTab);
  const shown = display.length > 0 ? display : CARS;

  return (
    <section className="bg-[#f4f5f6] py-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">Our Impressive Collection of Cars</h2>
          <p className="text-gray-900 max-w-xl mx-auto text-[13px] font-medium leading-relaxed">
            Ranging from elegant sedans to powerful sports cars, all carefully selected to provide our<br/>customers with the ultimate driving experience.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {TABS.map(tab => (
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

        {/* Car Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {shown.slice(0, 6).map((car, idx) => (
            <div key={car.id} className="bg-white rounded-3xl p-4 shadow-sm group">
              <div className="rounded-2xl overflow-hidden mb-4 relative aspect-[4/3]">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="px-2">
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{car.name}</h3>
                <p className="text-lg font-black text-gray-900 mb-5">
                  {car.price.toFixed(2)}<span className="text-xs font-medium text-gray-400">/day</span>
                </p>

                {/* Specs */}
                <div className="flex justify-between items-center mb-6 pt-4 border-t border-dashed border-gray-200">
                  <div className="flex flex-col items-center gap-1.5 text-black">
                    <MapPin size={16} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-gray-400">{car.miles}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-black">
                    <Settings size={16} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-gray-400">{car.transmission}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-black">
                    <Users size={16} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-gray-400">{car.seats} Seats</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-black">
                    <Fuel size={16} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-gray-400">{car.fuel}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/vehicles/${car.id}`)}
                  className={`w-full py-3.5 rounded-full font-bold text-xs transition-colors border-2 ${
                    car.isMiddle || idx === 1 // Just to match design highlight
                    ? 'bg-black text-white border-black hover:bg-gray-800 hover:border-gray-800' 
                    : 'bg-transparent text-black border-black hover:bg-black hover:text-white'
                  }`}
                >
                  Rent Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Show More Button */}
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

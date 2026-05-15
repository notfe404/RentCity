import { useState } from 'react';
import { MapPin, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();
  
  // Auto-fill logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // yyyy-mm-dd
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + 3);
  const futureStr = futureDate.toISOString().split('T')[0];

  // Round to nearest hour for default time
  const currentHour = now.getHours();
  const defaultTime = `${(currentHour + 1) % 12 || 12}:00 ${currentHour + 1 >= 12 ? 'PM' : 'AM'}`;

  const [pickup, setPickup] = useState('New York, location');
  const [dropoff, setDropoff] = useState('New York, location');
  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState(defaultTime);
  const [returnDate, setReturnDate] = useState(futureStr);
  const [returnTime, setReturnTime] = useState(defaultTime);

  return (
    <section className="relative w-full bg-[#111111] pt-32 pb-64 flex flex-col items-center overflow-visible z-10">
      
      {/* Background Image Full */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1920&auto=format&fit=crop" 
          alt="Luxury Car Background" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay to make text readable */}
        <div className="absolute inset-0 bg-black/60 sm:bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"></div>
      </div>

      {/* Slogan */}
      <h1 className="relative text-white text-4xl md:text-5xl lg:text-[54px] font-black text-center leading-[1.2] tracking-tight mb-8 px-4 z-10 pt-16">
        Discover the world on wheels<br className="hidden md:block"/>
        with our car rental service
      </h1>

      {/* Search Bar - Overlapping the bottom edge */}
      <div className="absolute bottom-0 translate-y-1/2 w-full max-w-6xl px-4 z-20">
        <div className="bg-white rounded-[2.5rem] p-5 shadow-[0_25px_60px_rgb(0,0,0,0.18)] border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
            
            {/* Pickup */}
            <div className="lg:col-span-3 w-full group">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block px-4 uppercase tracking-[0.5px]">Pick-up Location</label>
              <div className="relative flex items-center bg-[#f8f9fa] rounded-2xl border border-transparent group-hover:border-gray-200 transition-all duration-300">
                <MapPin className="absolute left-4 text-[#78ad44]" size={16} />
                <input
                  type="text"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  className="w-full bg-transparent border-none text-black text-[13px] font-bold rounded-2xl pl-11 pr-4 py-4.5 outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
            </div>

            {/* Pickup Date & Time Combined */}
            <div className="lg:col-span-3 w-full group">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block px-4 uppercase tracking-[0.5px]">Pick-up date & time</label>
              <div className="flex bg-[#f8f9fa] rounded-2xl border border-transparent group-hover:border-gray-200 transition-all duration-300 overflow-hidden">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    onClick={e => e.currentTarget.showPicker()}
                    className="w-full bg-transparent border-none text-black text-[13px] font-bold pl-5 pr-2 py-4.5 outline-none cursor-pointer [color-scheme:light] caret-transparent select-none"
                  />
                  <Calendar className="absolute right-2 text-gray-400 pointer-events-none" size={14} />
                </div>
                <div className="w-[1px] bg-gray-200 my-3"></div>
                <div className="flex-1 relative">
                  <select 
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    className="w-full bg-transparent border-none text-black text-[13px] font-bold px-4 py-4.5 outline-none appearance-none cursor-pointer"
                  >
                    {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dropoff */}
            <div className="lg:col-span-2 w-full group">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block px-4 uppercase tracking-[0.5px]">Drop-off</label>
              <div className="relative flex items-center bg-[#f8f9fa] rounded-2xl border border-transparent group-hover:border-gray-200 transition-all duration-300">
                <MapPin className="absolute left-4 text-gray-400" size={16} />
                <input
                  type="text"
                  value={dropoff}
                  onChange={e => setDropoff(e.target.value)}
                  className="w-full bg-transparent border-none text-black text-[13px] font-bold rounded-2xl pl-11 pr-4 py-4.5 outline-none"
                />
              </div>
            </div>

            {/* Dropoff Date & Time Combined */}
            <div className="lg:col-span-3 w-full group">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block px-4 uppercase tracking-[0.5px]">Return date & time</label>
              <div className="flex bg-[#f8f9fa] rounded-2xl border border-transparent group-hover:border-gray-200 transition-all duration-300 overflow-hidden">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="date"
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    onClick={e => e.currentTarget.showPicker()}
                    className="w-full bg-transparent border-none text-black text-[13px] font-bold pl-5 pr-2 py-4.5 outline-none cursor-pointer [color-scheme:light] caret-transparent select-none"
                  />
                  <Calendar className="absolute right-2 text-gray-400 pointer-events-none" size={14} />
                </div>
                <div className="w-[1px] bg-gray-200 my-3"></div>
                <div className="flex-1 relative">
                  <select 
                    value={returnTime}
                    onChange={e => setReturnTime(e.target.value)}
                    className="w-full bg-transparent border-none text-black text-[13px] font-bold px-4 py-4.5 outline-none appearance-none cursor-pointer"
                  >
                    {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="lg:col-span-1 w-full flex items-end">
              <button
                onClick={() => navigate('/search')}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold text-[13px] p-4.5 rounded-2xl transition-all shadow-xl hover:shadow-[#78ad44]/20 flex items-center justify-center gap-2 h-[52px]"
              >
                 <Search size={18} />
              </button>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}

import { ChevronRight, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const TOP_CITIES = ['New York', 'London', 'Berlin', 'Los Angeles', 'Paris'];
const EXPLORE   = ['Intercity rides', 'Limousine service', 'Chauffeur service', 'Private car service', 'Airport transfer'];
const INTERCITY = ['East Hampton - New York', 'New York - Washington', 'New York - Philadelphia', 'Abu Dhabi - Dubai', 'London - Birmingham'];

export default function Footer() {
  return (
    <footer className="w-full bg-[#212529] mt-10">
      <div className="max-w-7xl mx-auto text-gray-400 px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-6 mb-16">
          
          {/* Brand + newsletter (Col span 4) */}
          <div className="lg:col-span-4 pr-4">
            <a href="/" className="inline-block mb-8 bg-white p-2 px-4 rounded-2xl shadow-lg hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Rent City Logo" className="h-8 md:h-10 w-auto object-contain" />
            </a>
            
            <p className="text-xs font-semibold text-gray-300 mb-4 uppercase tracking-wider">
              Subscribe to the newsletter
            </p>
            <div className="flex max-w-[280px]">
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-[#343A40] border-none rounded-l-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B4D581]"
              />
              <button className="bg-white hover:bg-gray-100 px-4 rounded-r-lg flex items-center justify-center transition-colors">
                <ChevronRight size={18} className="text-black" />
              </button>
            </div>
          </div>

          {/* Links: Top Cities (Col span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-white text-sm font-bold mb-6">Top cities</h4>
            <ul className="space-y-3">
              {TOP_CITIES.map(c => (
                <li key={c}>
                  <a href="#" className="text-xs hover:text-white transition-colors">{c}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Explore (Col span 3) */}
          <div className="lg:col-span-3">
            <h4 className="text-white text-sm font-bold mb-6">Explore</h4>
            <ul className="space-y-3">
              {EXPLORE.map(e => (
                <li key={e}>
                  <a href="#" className="text-xs hover:text-white transition-colors">{e}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Intercity Trips (Col span 3) */}
          <div className="lg:col-span-3">
            <h4 className="text-white text-sm font-bold mb-6">Intercity rides</h4>
            <ul className="space-y-3">
              {INTERCITY.map(r => (
                <li key={r}>
                  <a href="#" className="text-xs hover:text-white transition-colors">{r}</a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] sm:text-xs">© 2024 RentCity. All rights reserved.</p>
          
          <div className="flex gap-6 text-[10px] sm:text-xs">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy policy</a>
            <a href="#" className="hover:text-white transition-colors">Legal notice</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>

          <div className="flex items-center gap-4">
            {[Youtube, Facebook, Twitter, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="hover:text-white transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}

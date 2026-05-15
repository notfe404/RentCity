import { Check } from 'lucide-react';

const FEATURES = [
  'For upto 6 Passengers',
  'Tinted Windows',
  'Incredible Sound System',
  'Drinks With Premium Rate',
  'Fiber Optic Lights',
  'Multipurpose Designer Limo',
  'Bar Area With Fridge',
  'DVD 4k Infotainment',
];

export default function Testimonial() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Only today $75/day
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto font-medium">
            Take advantage of our hot offers, saving a significant amount when renting a limousine.
          </p>
        </div>

        {/* Offer Card */}
        <div className="bg-[#EEF1F6] rounded-[2.5rem] flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left: Info */}
          <div className="p-8 md:p-12 lg:p-16 lg:w-1/2 flex flex-col justify-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Cadillac Escalade</h3>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2 mb-10">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <div>
              <button className="bg-gray-900 hover:bg-black text-white text-sm font-bold px-8 py-3.5 rounded-xl transition-colors">
                Reserve Now
              </button>
            </div>
          </div>

          {/* Right: Car Image */}
          <div className="lg:w-1/2 relative min-h-[300px]">
            <img
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"
              alt="Cadillac Escalade"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

        </div>

      </div>
    </section>
  );
}

import Header from '@/pages/LandingPage/Header';
import Footer from '@/pages/LandingPage/Footer';
import { Car, MapPin, Briefcase, CalendarClock, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const SERVICES = [
  {
    icon: Car,
    title: 'Self-Drive Rentals',
    description: 'Experience the ultimate freedom on the road with our diverse fleet of well-maintained vehicles. Choose your dream car and drive at your own pace.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: MapPin,
    title: 'Airport Transfers',
    description: 'Start or end your journey hassle-free. Our reliable airport transfer service ensures you arrive on time in comfort and style.',
    color: 'bg-green-100 text-[#78ad44]',
  },
  {
    icon: Briefcase,
    title: 'Corporate Leasing',
    description: 'Tailored mobility solutions for businesses. Enhance your corporate fleet with our flexible long-term leasing options.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: CalendarClock,
    title: 'Long-term Rentals',
    description: 'Need a car for a month or more? Enjoy discounted rates and premium support with our extended rental plans.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: ShieldCheck,
    title: 'Premium Insurance',
    description: 'Drive with peace of mind. All our rentals come with comprehensive insurance coverage to protect you on every journey.',
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: Zap,
    title: 'Electric Vehicles',
    description: 'Go green with our expanding fleet of electric vehicles. Sustainable, quiet, and incredibly fun to drive.',
    color: 'bg-teal-100 text-teal-600',
  },
];

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />
      
      <main className="flex-1 pt-32 md:pt-40 pb-16">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center pt-12 pb-20">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Our Premium <span className="text-[#78ad44]">Services</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Whether you need a car for a quick weekend getaway, a reliable corporate fleet, or a hassle-free airport transfer, RentCity has you covered with top-tier services.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate(ROUTES.SEARCH)}
              className="bg-[#78ad44] hover:bg-[#689938] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
            >
              Explore Fleet
            </button>
            <button 
              onClick={() => navigate(ROUTES.HOME)}
              className="bg-white text-gray-800 border-2 border-gray-200 hover:border-gray-300 font-bold py-3 px-8 rounded-full shadow-sm transition-colors"
            >
              Back to Home
            </button>
          </div>
        </section>

        {/* Services Grid */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${service.color} group-hover:scale-110 transition-transform`}>
                  <service.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-24">
          <div className="bg-gray-900 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-[#78ad44]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to hit the road?</h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">
                Join thousands of satisfied customers who trust RentCity for their mobility needs. Booking is fast, easy, and secure.
              </p>
              <button 
                onClick={() => navigate(ROUTES.SEARCH)}
                className="bg-[#78ad44] hover:bg-[#689938] text-white font-black py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 text-lg"
              >
                Book Your Ride Now
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { Search, Calendar, MapPin } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="bg-white py-24 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-3xl font-black text-black mb-4 tracking-tight">How it works</h2>
          <p className="text-black text-[13px] font-medium max-w-[650px] mx-auto leading-relaxed">
            Renting a luxury car has never been easier. Our streamlined process makes it simple for you<br />to book and confirm your vehicle of choice online.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left - Steps */}
          <div className="w-full lg:w-[45%] flex flex-col gap-6 justify-center">
            
            {/* Step 1 */}
            <div className="bg-white border rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex gap-4">
              <div className="bg-[#f8f9fa] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <Search size={18} className="text-black" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] mb-2 text-black">Browse and select</h3>
                <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                  Choose from our wide range of premium cars, select the<br/>pickup point and your nearest available that suit you best
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex gap-4">
              <div className="bg-[#f8f9fa] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-black" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] mb-2 text-black">Book and confirm</h3>
                <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                  Easily book your desired car with just a few clicks and receive an<br/>instant confirmation via email or SMS
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex gap-4">
              <div className="bg-[#f8f9fa] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-black" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] mb-2 text-black">Enjoy your ride</h3>
                <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                  Pick up your car at the designated location and enjoy your<br/>premium driving experience with our top quality service
                </p>
              </div>
            </div>

          </div>

          {/* Right - Image */}
          <div className="w-full lg:w-[55%] relative flex items-center justify-end">
            {/* Background shape */}
            <div className="absolute right-0 top-0 bottom-0 w-[80%] bg-[#f4f5f6] rounded-[2.5rem] -z-10"></div>
            
            <img 
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80" 
              alt="Luxury SUV" 
              className="w-[95%] h-auto object-cover rounded-3xl py-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>

      </div>
    </section>
  );
}

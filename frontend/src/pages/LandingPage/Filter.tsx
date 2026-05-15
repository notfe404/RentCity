

const brands = [
  { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg' },
  { name: 'BMW', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
  { name: 'Mercedes-Benz', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Audi', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Audi_logo_detail.svg' },
  { name: 'Hyundai', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
];

const bodyTypes = [
  { name: 'SUV', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=200' },
  { name: 'Crossover', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200' },
  { name: 'Wagon', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200' },
  { name: 'Family MPV', image: 'https://images.unsplash.com/photo-1583122620071-50e5e3ab4ee3?auto=format&fit=crop&q=80&w=200' },
  { name: 'Sport Coupe', image: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&q=80&w=200' },
  { name: 'Limousine', image: 'https://images.unsplash.com/photo-1522055620950-71647413fa25?auto=format&fit=crop&q=80&w=200' },
];

const Filter = () => {
  return (
    <section className="py-20 bg-deepBlack border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Rent by Brands */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-8 h-1 bg-gold rounded-full"></span>
            Rent by <span className="text-gold">Brands</span>
          </h2>
          <div className="flex overflow-x-auto pb-6 hide-scrollbar gap-6 snap-x">
            {brands.map((brand, index) => (
              <div 
                key={index}
                className="flex-none snap-center group cursor-pointer"
              >
                <div className="w-40 h-24 rounded-2xl bg-graphite border border-white/10 flex items-center justify-center p-6 transition-all duration-300 group-hover:border-gold group-hover:bg-white/5 group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(212,175,55,0.1)]">
                  <div className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">{brand.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rent by Body Type */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-8 h-1 bg-gold rounded-full"></span>
            Rent by <span className="text-gold">Body Type</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {bodyTypes.map((type, index) => (
              <div 
                key={index}
                className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[4/3]"
              >
                <img 
                  src={type.image} 
                  alt={type.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deepBlack via-deepBlack/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-0 w-full text-center">
                  <span className="text-sm font-semibold tracking-wider text-gray-300 group-hover:text-gold transition-colors block">
                    {type.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Filter;

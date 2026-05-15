const SERVICES = [
  {
    title: 'Airport transfers',
    desc: 'With additional wait time and flight tracking in case of delays, our service is optimized to make every airport transfer a breeze.',
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Intercity trips',
    desc: 'Your stressfree solution for traveling between cities with chauffeurs all over the world.',
    img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Wedding events',
    desc: 'Our friendly, and attentive service combined with thorough attention to detail ensure you can truly relax and enjoy your special day.',
    img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Business Meeting',
    desc: 'Focus on your meeting with your partners, forget about the road and the car, which will distract your thoughts.',
    img: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=600&q=80',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <h2 className="text-3xl md:text-3xl font-black text-black tracking-tight">Services</h2>
          <p className="text-gray-500 text-[13px] md:text-right font-medium max-w-sm leading-relaxed">
            We invite you to try our services, and we personally guarantee that you will be completely satisfied.
          </p>
        </div>

        {/* Grid 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SERVICES.map((s, i) => (
            <div key={i} className="bg-[#f8f9fa] rounded-3xl p-5 flex flex-col sm:flex-row gap-6 hover:shadow-sm transition-shadow">
              <img
                src={s.img}
                alt={s.title}
                className="w-full sm:w-[220px] h-[220px] object-cover rounded-[1.5rem] flex-shrink-0"
              />
              <div className="flex flex-col justify-center py-2 pr-2">
                <h3 className="font-bold text-black text-[17px] mb-3">{s.title}</h3>
                <p className="text-gray-500 text-[12px] leading-relaxed mb-6 font-medium">{s.desc}</p>
                <div>
                  <button className="bg-black hover:bg-gray-800 text-white text-[11px] font-bold px-7 py-3 rounded-xl transition-colors">
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

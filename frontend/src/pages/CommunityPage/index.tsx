import Header from '@/pages/LandingPage/Header';
import Footer from '@/pages/LandingPage/Footer';
import mapIcon from '@/assets/map.svg';
import { Star, MessageSquare, Heart, Share2, Map } from 'lucide-react';

const FEATURED_STORIES = [
  {
    author: 'Sarah Jenkins',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random',
    title: 'A Weekend Getaway to the Mountains',
    excerpt: 'Renting the SUV from RentCity made our family trip unforgettable. The car handled the steep terrains perfectly...',
    likes: 124,
    comments: 18,
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800',
  },
  {
    author: 'David Chen',
    avatar: 'https://ui-avatars.com/api/?name=David+Chen&background=random',
    title: 'Business Trip in the City',
    excerpt: 'The premium sedan I booked was immaculate. It definitely left a great impression on my clients during our meetings.',
    likes: 89,
    comments: 5,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800',
  },
  {
    author: 'Emma & Lucas',
    avatar: 'https://ui-avatars.com/api/?name=Emma+Lucas&background=random',
    title: 'Our Cross-Country Road Trip',
    excerpt: 'Two weeks, 3000 miles, and zero issues. The camper van we got was essentially our home away from home.',
    likes: 256,
    comments: 42,
    image: 'https://i.pinimg.com/originals/81/83/72/818372dc919f7b2e5246c443579bcd11.jpg',
  }
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />
      
      <main className="flex-1 pt-32 md:pt-40 pb-16">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center pt-12 pb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Welcome to the <span className="text-[#78ad44]">Community</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Discover travel stories, tips, and experiences shared by our amazing RentCity members. Get inspired for your next adventure.
          </p>
          <div className="flex justify-center">
            <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105">
              <MessageSquare size={20} />
              Share Your Story
            </button>
          </div>
        </section>

        {/* Featured Stories Grid */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900">Featured Stories</h2>
            <button className="text-[#78ad44] font-bold hover:underline">View All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_STORIES.map((story, index) => (
              <div key={index} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={story.image} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold text-gray-700">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    Featured
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={story.avatar} alt={story.author} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-bold text-gray-600">{story.author}</span>
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-2">{story.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                    {story.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-gray-500">
                      <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                        <Heart size={18} />
                        <span className="text-sm font-medium">{story.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                        <MessageSquare size={18} />
                        <span className="text-sm font-medium">{story.comments}</span>
                      </button>
                    </div>
                    <button className="text-gray-400 hover:text-gray-700 transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Travel Guides Banner */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-20">
          <div className="bg-[#f4f8f7] rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#e9f2eb]">
            <div className="max-w-xl">
              <div className="w-12 h-12 bg-[#78ad44] rounded-2xl flex items-center justify-center text-white mb-6">
                <Map size={24} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Local Travel Guides</h2>
              <p className="text-gray-600 text-lg mb-8">
                Not sure where to go? Explore our curated guides written by locals to find the best spots, scenic routes, and hidden gems in the city.
              </p>
              <button className="bg-[#78ad44] hover:bg-[#689938] text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform hover:scale-105">
                Explore Guides
              </button>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <img 
                src={mapIcon}
                alt="Travel Map Illustration" 
                className="w-full max-w-sm"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

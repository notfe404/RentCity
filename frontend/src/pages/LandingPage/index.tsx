import Header from './Header';
import Hero from './Hero';
import BrandsSection from './BrandsSection';
import CarCollection from './CarCollection';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <Hero />
      <BrandsSection />
      <CarCollection />
      <HowItWorks />
      <Footer />
    </div>
  );
}

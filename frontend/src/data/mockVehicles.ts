export interface MockVehicle {
  id: string;
  name: string;
  brand: string;
  type: string;
  category: string;
  price: number;        // VND per day
  image: string;
  images: string[];
  passengers: number;
  doors: number;
  transmission: 'Manual' | 'Automatic';
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  luggage: number;
  year: number;
  avgRating: number;
  totalTrips: number;
  locationId: string;
  description: string;
  features: string[];
}

export const MOCK_VEHICLES: MockVehicle[] = [
  {
    id: '1',
    name: 'Toyota Vios 2024',
    brand: 'Toyota',
    type: 'Sedan',
    category: 'Sedan',
    price: 700000,
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 3, year: 2024, avgRating: 4.8, totalTrips: 156, locationId: 'loc-02',
    description: 'Toyota Vios 2024 - a best-selling sedan with great fuel economy, a roomy cabin, and strong city or long-distance comfort.',
    features: ['Rear camera', 'Parking sensors', 'Bluetooth', 'USB/AUX', 'Automatic A/C', 'Smart key'],
  },
  {
    id: '2',
    name: 'Honda City 2024',
    brand: 'Honda',
    type: 'Sedan',
    category: 'Sedan',
    price: 750000,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0b16?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0b16?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 3, year: 2024, avgRating: 4.7, totalTrips: 132, locationId: 'loc-03',
    description: 'Honda City RS 2024 with a powerful 1.5L VTEC TURBO engine, premium interior, and Honda SENSING safety system.',
    features: ['Honda SENSING', 'Camera 360', 'Parking sensors', 'CarPlay', 'Android Auto', 'Automatic A/C'],
  },
  {
    id: '3',
    name: 'Hyundai Tucson 2024',
    brand: 'Hyundai',
    type: 'Mid-size SUV',
    category: 'SUV',
    price: 1100000,
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 4, year: 2024, avgRating: 4.6, totalTrips: 98, locationId: 'loc-01',
    description: 'Hyundai Tucson 2024 with Parametric Dynamic styling, spacious cabin, and family-friendly travel comfort.',
    features: ['Camera 360', 'Sunroof', 'Power seats', 'Blind spot warning', 'CarPlay', 'Electronic parking brake'],
  },
  {
    id: '4',
    name: 'Mazda CX-5 2024',
    brand: 'Mazda',
    type: 'Mid-size SUV',
    category: 'SUV',
    price: 1050000,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 4, year: 2024, avgRating: 4.7, totalTrips: 112, locationId: 'loc-02',
    description: 'Mazda CX-5 2024 with KODO styling, refined Nappa leather interior, and smooth SkyActiv performance.',
    features: ['Nappa leather interior', 'Power seats', 'HUD Display', 'Rear camera', 'Parking sensors', 'Dual-zone A/C'],
  },
  {
    id: '5',
    name: 'KIA Carnival 2024',
    brand: 'KIA',
    type: 'Premium MPV',
    category: 'Van',
    price: 1500000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Automatic', fuelType: 'Diesel',
    luggage: 5, year: 2024, avgRating: 4.9, totalTrips: 75, locationId: 'loc-01',
    description: 'KIA Carnival 2024 - a premium 7-seat MPV with segment-leading space for large families or group business trips.',
    features: ['Second-row VIP seats', 'Power sliding doors', 'Camera 360', 'Second-row entertainment screen', '3-zone A/C', 'Power tailgate'],
  },
  {
    id: '6',
    name: 'VinFast VF 8 2024',
    brand: 'VinFast',
    type: 'Electric SUV',
    category: 'SUV',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Electric',
    luggage: 4, year: 2024, avgRating: 4.5, totalTrips: 64, locationId: 'loc-03',
    description: 'VinFast VF 8 - a Vietnamese electric SUV with zero emissions, ADAS level 2 assistance, and a quiet modern drive.',
    features: ['ADAS L2 driving assist', '15.6" Display', 'DC fast charging', 'Camera 360', 'Power seats', 'Power tailgate'],
  },
  {
    id: '7',
    name: 'Toyota Fortuner 2024',
    brand: 'Toyota',
    type: 'SUV 7 seats',
    category: 'SUV',
    price: 1300000,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Automatic', fuelType: 'Diesel',
    luggage: 4, year: 2024, avgRating: 4.8, totalTrips: 203, locationId: 'loc-04',
    description: 'Toyota Fortuner 2024 - a popular 7-seat SUV with high clearance, four-wheel drive, and strong long-distance capability.',
    features: ['4WD', 'Rear camera', 'Cruise Control', 'Leather seats', 'Automatic A/C', 'LED lights'],
  },
  {
    id: '8',
    name: 'Hyundai Accent 2024',
    brand: 'Hyundai',
    type: 'Sedan',
    category: 'Sedan',
    price: 650000,
    image: 'https://images.unsplash.com/photo-1503378414167-bd1ad040c5f0?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503378414167-bd1ad040c5f0?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 3, year: 2024, avgRating: 4.6, totalTrips: 178, locationId: 'loc-05',
    description: 'Hyundai Accent 2024 - an efficient B-segment sedan with modern design for daily use or ride service.',
    features: ['Rear camera', 'Bluetooth', 'Push-button start', 'Power folding mirrors', 'Automatic A/C', 'USB'],
  },
  {
    id: '9',
    name: 'Mercedes-Benz C200 2024',
    brand: 'Mercedes-Benz',
    type: 'Luxury Sedan',
    category: 'Luxury',
    price: 2000000,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 3, year: 2024, avgRating: 4.9, totalTrips: 45, locationId: 'loc-02',
    description: 'Mercedes-Benz C200 Exclusive 2024 - a luxury sedan with premium leather interior, MBUX technology, and semi-autonomous assistance.',
    features: ['MBUX', 'Artico leather interior', '64-color ambient lighting', 'Sunroof', 'Memory seats', 'Electronic parking brake'],
  },
  {
    id: '10',
    name: 'Ford Ranger 2024',
    brand: 'Ford',
    type: 'Pickup Truck',
    category: 'SUV',
    price: 1100000,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Automatic', fuelType: 'Diesel',
    luggage: 5, year: 2024, avgRating: 4.5, totalTrips: 89, locationId: 'loc-04',
    description: 'Ford Ranger Wildtrak 2024 - a powerful pickup with a large bed and 4x4 capability for remote work or off-road trips.',
    features: ['4x4 drivetrain', 'Camera 360', 'Cruise Control', 'Apple CarPlay', 'Power leather seats', 'LED lights'],
  },
  {
    id: '11',
    name: 'Honda CR-V 2024',
    brand: 'Honda',
    type: 'Mid-size SUV',
    category: 'SUV',
    price: 1150000,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0b16?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0b16?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 4, year: 2024, avgRating: 4.7, totalTrips: 141, locationId: 'loc-06',
    description: 'Honda CR-V 2024 with a new-generation cabin, three rows, full Honda SENSING, and family-ready comfort.',
    features: ['Honda SENSING', 'Three-row seats', 'Sunroof', 'Rear camera', 'Remote start', '3-zone A/C'],
  },
  {
    id: '12',
    name: 'Mitsubishi Xpander 2024',
    brand: 'Mitsubishi',
    type: 'MPV 7 seats',
    category: 'Van',
    price: 800000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Automatic', fuelType: 'Gasoline',
    luggage: 3, year: 2024, avgRating: 4.4, totalTrips: 167, locationId: 'loc-05',
    description: 'Mitsubishi Xpander 2024 - a good-value 7-seat MPV with high clearance for families and Vietnamese roads.',
    features: ['Rear camera', 'Infotainment screen', 'Bluetooth', 'USB', 'Rear A/C', 'Power folding mirrors'],
  },
];

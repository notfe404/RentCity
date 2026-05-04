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
  transmission: 'Số sàn' | 'Số tự động';
  fuelType: 'Xăng' | 'Dầu diesel' | 'Điện' | 'Hybrid';
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
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 3, year: 2024, avgRating: 4.8, totalTrips: 156, locationId: 'loc-02',
    description: 'Toyota Vios 2024 — sedan bán chạy nhất Việt Nam. Tiết kiệm nhiên liệu, cabin rộng rãi, phù hợp di chuyển nội thành và đường dài.',
    features: ['Camera lùi', 'Cảm biến đỗ xe', 'Bluetooth', 'USB/AUX', 'Điều hoà tự động', 'Khóa thông minh'],
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
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 3, year: 2024, avgRating: 4.7, totalTrips: 132, locationId: 'loc-03',
    description: 'Honda City RS 2024 với động cơ 1.5L VTEC TURBO mạnh mẽ, nội thất cao cấp, hệ thống an toàn Honda SENSING.',
    features: ['Honda SENSING', 'Camera 360', 'Cảm biến đỗ xe', 'CarPlay', 'Android Auto', 'Điều hoà tự động'],
  },
  {
    id: '3',
    name: 'Hyundai Tucson 2024',
    brand: 'Hyundai',
    type: 'SUV hạng trung',
    category: 'SUV',
    price: 1100000,
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 4, year: 2024, avgRating: 4.6, totalTrips: 98, locationId: 'loc-01',
    description: 'Hyundai Tucson 2024 thiết kế Parametric Dynamic, cabin rộng rãi, phù hợp gia đình và du lịch.',
    features: ['Camera 360', 'Cửa sổ trời', 'Ghế chỉnh điện', 'Cảnh báo điểm mù', 'CarPlay', 'Phanh tay điện tử'],
  },
  {
    id: '4',
    name: 'Mazda CX-5 2024',
    brand: 'Mazda',
    type: 'SUV hạng trung',
    category: 'SUV',
    price: 1050000,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 4, year: 2024, avgRating: 4.7, totalTrips: 112, locationId: 'loc-02',
    description: 'Mazda CX-5 2024 phong cách KODO, nội thất sang trọng bọc da Nappa, vận hành mượt mà với công nghệ SkyActiv.',
    features: ['Nội thất da Nappa', 'Ghế chỉnh điện', 'Màn hình HUD', 'Camera lùi', 'Cảm biến đỗ xe', 'Điều hoà 2 vùng'],
  },
  {
    id: '5',
    name: 'KIA Carnival 2024',
    brand: 'KIA',
    type: 'MPV cao cấp',
    category: 'Van',
    price: 1500000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Số tự động', fuelType: 'Dầu diesel',
    luggage: 5, year: 2024, avgRating: 4.9, totalTrips: 75, locationId: 'loc-01',
    description: 'KIA Carnival 2024 — MPV hạng sang 7 chỗ, không gian rộng nhất phân khúc, phù hợp gia đình đông hoặc công tác nhóm.',
    features: ['Ghế VIP hàng 2', 'Cửa trượt điện', 'Camera 360', 'Màn hình giải trí hàng 2', 'Điều hoà 3 vùng', 'Cốp điện'],
  },
  {
    id: '6',
    name: 'VinFast VF 8 2024',
    brand: 'VinFast',
    type: 'SUV điện',
    category: 'SUV',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Điện',
    luggage: 4, year: 2024, avgRating: 4.5, totalTrips: 64, locationId: 'loc-03',
    description: 'VinFast VF 8 — SUV điện thương hiệu Việt, 0 khí thải, công nghệ tự lái ADAS cấp 2, trải nghiệm lái yên tĩnh và hiện đại.',
    features: ['Tự lái ADAS L2', 'Màn hình 15.6"', 'Sạc nhanh DC', 'Camera 360', 'Ghế chỉnh điện', 'Cốp điện'],
  },
  {
    id: '7',
    name: 'Toyota Fortuner 2024',
    brand: 'Toyota',
    type: 'SUV 7 chỗ',
    category: 'SUV',
    price: 1300000,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Số tự động', fuelType: 'Dầu diesel',
    luggage: 4, year: 2024, avgRating: 4.8, totalTrips: 203, locationId: 'loc-04',
    description: 'Toyota Fortuner 2024 — "vua" SUV 7 chỗ tại Việt Nam. Gầm cao, dẫn động 4 bánh, phù hợp đường trường và mọi địa hình.',
    features: ['Dẫn động 4WD', 'Camera lùi', 'Cruise Control', 'Ghế da', 'Điều hoà tự động', 'Đèn LED'],
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
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 3, year: 2024, avgRating: 4.6, totalTrips: 178, locationId: 'loc-05',
    description: 'Hyundai Accent 2024 — sedan cỡ B tiết kiệm, thiết kế hiện đại, phù hợp chạy dịch vụ và đi lại hàng ngày.',
    features: ['Camera lùi', 'Bluetooth', 'Khởi động nút bấm', 'Gương gập điện', 'Điều hoà tự động', 'USB'],
  },
  {
    id: '9',
    name: 'Mercedes-Benz C200 2024',
    brand: 'Mercedes-Benz',
    type: 'Sedan hạng sang',
    category: 'Luxury',
    price: 2000000,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 3, year: 2024, avgRating: 4.9, totalTrips: 45, locationId: 'loc-02',
    description: 'Mercedes-Benz C200 Exclusive 2024 — sedan hạng sang với nội thất da cao cấp, công nghệ MBUX, tự lái bán phần.',
    features: ['MBUX', 'Nội thất da Artico', 'Đèn LED 64 màu', 'Cửa sổ trời', 'Ghế nhớ vị trí', 'Phanh tay điện tử'],
  },
  {
    id: '10',
    name: 'Ford Ranger 2024',
    brand: 'Ford',
    type: 'Bán tải',
    category: 'SUV',
    price: 1100000,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 5, doors: 4, transmission: 'Số tự động', fuelType: 'Dầu diesel',
    luggage: 5, year: 2024, avgRating: 4.5, totalTrips: 89, locationId: 'loc-04',
    description: 'Ford Ranger Wildtrak 2024 — bán tải mạnh mẽ, thùng rộng, dẫn động 4x4, lý tưởng cho công tác vùng xa và off-road.',
    features: ['Dẫn động 4x4', 'Camera 360', 'Cruise Control', 'Apple CarPlay', 'Ghế da chỉnh điện', 'Đèn LED'],
  },
  {
    id: '11',
    name: 'Honda CR-V 2024',
    brand: 'Honda',
    type: 'SUV hạng trung',
    category: 'SUV',
    price: 1150000,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0b16?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0b16?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 4, year: 2024, avgRating: 4.7, totalTrips: 141, locationId: 'loc-06',
    description: 'Honda CR-V 2024 thế hệ mới, cabin 3 hàng ghế, Honda SENSING đầy đủ, phù hợp gia đình.',
    features: ['Honda SENSING', 'Ghế 3 hàng', 'Cửa sổ trời', 'Camera lùi', 'Khởi động từ xa', 'Điều hoà 3 vùng'],
  },
  {
    id: '12',
    name: 'Mitsubishi Xpander 2024',
    brand: 'Mitsubishi',
    type: 'MPV 7 chỗ',
    category: 'Van',
    price: 800000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    ],
    passengers: 7, doors: 4, transmission: 'Số tự động', fuelType: 'Xăng',
    luggage: 3, year: 2024, avgRating: 4.4, totalTrips: 167, locationId: 'loc-05',
    description: 'Mitsubishi Xpander 2024 — MPV 7 chỗ giá tốt, gầm cao, phù hợp gia đình và đường Việt Nam.',
    features: ['Camera lùi', 'Màn hình giải trí', 'Bluetooth', 'USB', 'Điều hoà sau', 'Gương gập điện'],
  },
];

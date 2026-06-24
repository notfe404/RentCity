import type { Review } from '@/types';

// ============================================================
// Mock Reviews - English review data
// ============================================================

export interface MockReview extends Review {
  customerName: string;
  customerAvatar?: string;
}

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'rv-01', bookingId: 'bk-01', customerId: 'u-01', vehicleId: '1',
    overallRating: 5, vehicleRating: 5, serviceRating: 5,
    comment: 'Vehicle was very new and clean, and the staff delivered it on time. I will come back next time!',
    isVisible: true, createdAt: '2026-04-20T10:30:00Z',
    customerName: 'An Nguyen',
    customerAvatar: 'https://ui-avatars.com/api/?name=Nguyen+An&background=78ad44&color=fff',
  },
  {
    id: 'rv-02', bookingId: 'bk-02', customerId: 'u-02', vehicleId: '1',
    overallRating: 4, vehicleRating: 4, serviceRating: 5,
    comment: 'The vehicle ran smoothly and saved fuel. Staff were very helpful. It only lacked windshield washer fluid.',
    isVisible: true, createdAt: '2026-04-15T14:00:00Z',
    customerName: 'Bich Tran',
    customerAvatar: 'https://ui-avatars.com/api/?name=Tran+Bich&background=4a90d9&color=fff',
  },
  {
    id: 'rv-03', bookingId: 'bk-03', customerId: 'u-03', vehicleId: '2',
    overallRating: 5, vehicleRating: 5, serviceRating: 4,
    comment: 'The Honda City was very good with a clean interior. Fast delivery at Noi Bai Airport.',
    isVisible: true, createdAt: '2026-04-12T09:00:00Z',
    customerName: 'Duc Le',
    customerAvatar: 'https://ui-avatars.com/api/?name=Le+Duc&background=e67e22&color=fff',
  },
  {
    id: 'rv-04', bookingId: 'bk-04', customerId: 'u-04', vehicleId: '3',
    overallRating: 5, vehicleRating: 5, serviceRating: 5,
    comment: 'The Tucson drove great, with a spacious cabin. Very comfortable for a family of four to Ha Long.',
    isVisible: true, createdAt: '2026-04-10T16:00:00Z',
    customerName: 'Nhung Pham',
    customerAvatar: 'https://ui-avatars.com/api/?name=Pham+Nhung&background=9b59b6&color=fff',
  },
  {
    id: 'rv-05', bookingId: 'bk-05', customerId: 'u-05', vehicleId: '5',
    overallRating: 5, vehicleRating: 5, serviceRating: 5,
    comment: 'The Carnival was excellent! The second-row VIP seats felt like business class. Highly recommended.',
    isVisible: true, createdAt: '2026-04-08T11:00:00Z',
    customerName: 'Tuan Hoang',
    customerAvatar: 'https://ui-avatars.com/api/?name=Hoang+Tuan&background=2ecc71&color=fff',
  },
  {
    id: 'rv-06', bookingId: 'bk-06', customerId: 'u-06', vehicleId: '6',
    overallRating: 4, vehicleRating: 4, serviceRating: 4,
    comment: 'The VF8 was quiet to drive with modern technology. Charging stations on long trips were the only concern.',
    isVisible: true, createdAt: '2026-04-05T13:00:00Z',
    customerName: 'Huong Vu',
    customerAvatar: 'https://ui-avatars.com/api/?name=Vu+Huong&background=e74c3c&color=fff',
  },
  {
    id: 'rv-07', bookingId: 'bk-07', customerId: 'u-07', vehicleId: '7',
    overallRating: 5, vehicleRating: 5, serviceRating: 4,
    comment: 'The Fortuner was excellent for the Hanoi-Sapa long drive, with high clearance for rough roads.',
    isVisible: true, createdAt: '2026-04-02T08:00:00Z',
    customerName: 'Huy Do',
    customerAvatar: 'https://ui-avatars.com/api/?name=Do+Huy&background=f39c12&color=fff',
  },
  {
    id: 'rv-08', bookingId: 'bk-08', customerId: 'u-08', vehicleId: '9',
    overallRating: 5, vehicleRating: 5, serviceRating: 5,
    comment: 'The Mercedes C200 was worth the price. Luxurious interior and beautiful ambient lighting.',
    isVisible: true, createdAt: '2026-03-28T15:00:00Z',
    customerName: 'Tung Ngo',
    customerAvatar: 'https://ui-avatars.com/api/?name=Ngo+Tung&background=1abc9c&color=fff',
  },
  {
    id: 'rv-09', bookingId: 'bk-09', customerId: 'u-09', vehicleId: '4',
    overallRating: 4, vehicleRating: 5, serviceRating: 4,
    comment: 'The CX-5 had a beautiful interior and smooth driving feel. KODO design is attractive and suitable for business trips.',
    isVisible: true, createdAt: '2026-03-25T10:00:00Z',
    customerName: 'Khoa Bui',
    customerAvatar: 'https://ui-avatars.com/api/?name=Bui+Khoa&background=3498db&color=fff',
  },
  {
    id: 'rv-10', bookingId: 'bk-10', customerId: 'u-10', vehicleId: '12',
    overallRating: 4, vehicleRating: 4, serviceRating: 5,
    comment: 'The Xpander is affordable and spacious, comfortably seating seven people. High clearance handles flooded roads well.',
    isVisible: true, createdAt: '2026-03-20T12:00:00Z',
    customerName: 'Mai Dinh',
    customerAvatar: 'https://ui-avatars.com/api/?name=Dinh+Mai&background=e91e63&color=fff',
  },
];

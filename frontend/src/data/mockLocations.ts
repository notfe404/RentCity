import type { Location } from '@/types';

export const MOCK_LOCATIONS: Location[] = [
  {
    id: 'loc-01', name: 'CN Nội Bài',
    address: 'Sân bay Quốc tế Nội Bài, Sóc Sơn', city: 'Hà Nội',
    latitude: 21.2187, longitude: 105.8044,
    phone: '024 3886 0001', openTime: '06:00', closeTime: '23:00', isActive: true,
  },
  {
    id: 'loc-02', name: 'CN Hoàn Kiếm',
    address: '15 Tràng Thi, Hoàn Kiếm', city: 'Hà Nội',
    latitude: 21.0285, longitude: 105.8542,
    phone: '024 3826 0002', openTime: '07:00', closeTime: '21:00', isActive: true,
  },
  {
    id: 'loc-03', name: 'CN Cầu Giấy',
    address: '120 Xuân Thủy, Cầu Giấy', city: 'Hà Nội',
    latitude: 21.0367, longitude: 105.7816,
    phone: '024 3793 0003', openTime: '07:00', closeTime: '21:00', isActive: true,
  },
  {
    id: 'loc-04', name: 'CN Long Biên',
    address: '50 Nguyễn Văn Cừ, Long Biên', city: 'Hà Nội',
    latitude: 21.0475, longitude: 105.8838,
    phone: '024 3827 0004', openTime: '07:00', closeTime: '21:00', isActive: true,
  },
  {
    id: 'loc-05', name: 'CN Hà Đông',
    address: '300 Quang Trung, Hà Đông', city: 'Hà Nội',
    latitude: 20.9711, longitude: 105.7775,
    phone: '024 3350 0005', openTime: '07:00', closeTime: '21:00', isActive: true,
  },
  {
    id: 'loc-06', name: 'CN Thanh Xuân',
    address: '83 Nguyễn Trãi, Thanh Xuân', city: 'Hà Nội',
    latitude: 21.0005, longitude: 105.8000,
    phone: '024 3558 0006', openTime: '07:00', closeTime: '21:00', isActive: true,
  },
];

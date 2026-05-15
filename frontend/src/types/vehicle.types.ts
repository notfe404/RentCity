// ============================================================
// Vehicle Types — B2C Model
// ============================================================

export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
export type Transmission = 'MANUAL' | 'AUTOMATIC';

// Bảng vehicle_categories
export interface VehicleCategory {
  id: string;
  name: string;               // Mini | Sedan | SUV | Luxury | Van
  description?: string;
  basePriceDay: number;       // giá/ngày cơ bản
  basePriceHour?: number;
  depositRate: number;        // tỉ lệ cọc (0.30 = 30%)
  isActive: boolean;
}

// Bảng locations (chi nhánh)
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openTime: string;   // "07:00"
  closeTime: string;  // "21:00"
  isActive: boolean;
}

// Bảng vehicle_images
export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

// Bảng vehicles
export interface Vehicle {
  id: string;
  categoryId: string;
  category?: VehicleCategory;       // joined khi cần
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  seats: number;
  fuelType: FuelType;
  transmission: Transmission;
  currentOdometer: number;
  locationId: string;
  location?: Location;              // joined khi cần
  status: VehicleStatus;
  description?: string;
  avgRating: number;
  totalTrips: number;
  images: VehicleImage[];
  createdAt: string;
}

// Label tiếng Việt
export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  GASOLINE: 'Xăng',
  DIESEL:   'Dầu diesel',
  ELECTRIC: 'Điện',
  HYBRID:   'Hybrid',
};

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  MANUAL:    'Số sàn',
  AUTOMATIC: 'Số tự động',
};

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, { label: string; color: string }> = {
  AVAILABLE:   { label: 'Sẵn sàng',    color: 'green' },
  RENTED:      { label: 'Đang thuê',   color: 'blue' },
  MAINTENANCE: { label: 'Bảo dưỡng',   color: 'yellow' },
  RETIRED:     { label: 'Ngừng hoạt động', color: 'gray' },
};

// ---- Request types ----
export interface SearchVehicleParams {
  city?: string;
  startDate?: string;      // ISO datetime
  endDate?: string;
  seats?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  categoryId?: string;
  locationId?: string;
  minPrice?: number;
  maxPrice?: number;
}

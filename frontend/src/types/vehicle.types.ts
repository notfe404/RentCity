// ============================================================
// Vehicle Types — B2C Model
// ============================================================

export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
export type Transmission = 'MANUAL' | 'AUTOMATIC';

// vehicle_categories table
export interface VehicleCategory {
  id: string;
  name: string;               // Mini | Sedan | SUV | Luxury | Van
  description?: string;
  basePriceDay: number;       // base price per day
  basePriceHour?: number;
  depositRate: number;        // deposit rate (0.30 = 30%)
  isActive: boolean;
}

// locations table (branches)
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

// vehicle_images table
export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

// vehicles table
export interface Vehicle {
  id: string;
  categoryId: string;
  category?: VehicleCategory;       // joined when needed
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  seats: number;
  fuelType: FuelType;
  transmission: Transmission;
  locationId: string;
  location?: Location;              // joined when needed
  status: VehicleStatus;
  description?: string;
  avgRating: number;
  totalTrips: number;
  images: VehicleImage[];
  createdAt: string;
}

// Display labels
export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  GASOLINE: 'Gasoline',
  DIESEL:   'Diesel',
  ELECTRIC: 'Electric',
  HYBRID:   'Hybrid',
};

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  MANUAL:    'Manual',
  AUTOMATIC: 'Automatic',
};

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, { label: string; color: string }> = {
  AVAILABLE:   { label: 'Available',    color: 'green' },
  RENTED:      { label: 'Ongoing',   color: 'blue' },
  MAINTENANCE: { label: 'Maintenance',   color: 'yellow' },
  RETIRED:     { label: 'Retired', color: 'gray' },
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

export interface ApiCarImageResponse {
  id: number;
  imageUrl: string;
  primary: boolean;
}

export type ApiConditionReportType = 'INITIAL' | 'RETURN';
export type ApiCarCondition = 'GOOD' | 'DAMAGE' | 'NEED_MAINTENANCE';

export interface ApiCarConditionImageResponse {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

export interface ApiCarConditionResponse {
  id: number;
  carId: number;
  bookingId?: number | null;
  reportType: ApiConditionReportType;
  condition: ApiCarCondition;
  damageFound: boolean;
  notes?: string | null;
  createdAt: string;
  images: ApiCarConditionImageResponse[];
}

export interface ApiCarResponse {
  id: number;
  categoryId?: number | null;
  categoryName?: string | null;
  seats?: number | null;
  branchId?: number | null;
  branchName?: string | null;
  licensePlate: string;
  brand: string;
  model: string;
  year?: number | null;
  transmission: 'AUTO' | 'MANUAL';
  fuelType: FuelType;
  pricePerDay: number;
  deposit?: number | null;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
  description?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  primaryImageUrl?: string | null;
  images: ApiCarImageResponse[];
  currentCondition?: ApiCarConditionResponse | null;
}

export interface ApiPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

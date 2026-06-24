import type { MockVehicle } from '@/data/mockVehicles';
import type { ApiCarResponse } from '@/types';

export type DisplayVehicle = MockVehicle & {
  branchId?: number | null;
  branchName?: string | null;
  licensePlate?: string;
  deposit?: number | null;
  backendStatus?: ApiCarResponse['status'];
  currentCondition?: ApiCarResponse['currentCondition'];
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop';

export function mapApiCarToDisplayVehicle(car: ApiCarResponse): DisplayVehicle {
  const imageUrls = car.images?.map((image) => image.imageUrl) ?? [];
  const primaryImage = car.primaryImageUrl ?? imageUrls[0] ?? PLACEHOLDER_IMAGE;

  return {
    id: String(car.id),
    name: `${car.brand} ${car.model}${car.year ? ` ${car.year}` : ''}`.trim(),
    brand: car.brand,
    type: car.categoryName ?? 'Vehicle',
    category: car.categoryName ?? 'Vehicle',
    price: Number(car.pricePerDay ?? 0),
    image: primaryImage,
    images: imageUrls.length > 0 ? imageUrls : [primaryImage],
    passengers: car.seats ?? 4,
    doors: 4,
    transmission: car.transmission === 'AUTO' ? 'Automatic' : 'Manual',
    fuelType: 'Gasoline',
    luggage: Math.max(2, Math.min(5, car.seats ?? 3)),
    year: car.year ?? new Date().getFullYear(),
    avgRating: Number(car.averageRating ?? 0),
    totalTrips: Number(car.reviewCount ?? 0),
    locationId: car.branchId ? String(car.branchId) : '',
    description: car.description ?? 'No description is available for this vehicle.',
    features: [
      car.transmission === 'AUTO' ? 'Automatic' : 'Manual',
      `${car.seats ?? 4} seats`,
      car.categoryName ?? 'Standard vehicle class',
      'Basic insurance',
    ],
    branchId: car.branchId,
    branchName: car.branchName,
    licensePlate: car.licensePlate,
    deposit: car.deposit ?? null,
    backendStatus: car.status,
    currentCondition: car.currentCondition,
  };
}

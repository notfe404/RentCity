DO $$
BEGIN
    IF to_regclass('public.cars') IS NOT NULL THEN
        ALTER TABLE cars
            ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) NOT NULL DEFAULT 'GASOLINE';

        ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_fuel_type_check;
        ALTER TABLE cars ADD CONSTRAINT cars_fuel_type_check
            CHECK (fuel_type IN ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'));
    END IF;
END $$;

INSERT INTO branches (name, address, phone, city)
VALUES ('Chi nhánh Cầu Giấy', '88 Trần Thái Tông, Cầu Giấy', '0243766222', 'Hà Nội')
ON CONFLICT (name) DO UPDATE
SET address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city;

INSERT INTO car_categories (name, seats, description, base_price_day, deposit_rate, is_active)
VALUES
    ('Sedan', 5, 'Comfortable passenger cars for city and business travel.', 900000, 0.30, TRUE),
    ('SUV', 5, 'Higher-clearance vehicles for family and longer trips.', 1200000, 0.30, TRUE),
    ('Van', 7, 'Multi-seat vehicles for family, airport and group transfer.', 1000000, 0.30, TRUE),
    ('Luxury', 5, 'Premium vehicles for executive and VIP rental.', 3000000, 0.30, TRUE)
ON CONFLICT (name) DO UPDATE
SET seats = EXCLUDED.seats,
    description = EXCLUDED.description,
    base_price_day = EXCLUDED.base_price_day,
    deposit_rate = EXCLUDED.deposit_rate,
    is_active = TRUE;

DELETE FROM car_images;
DELETE FROM cars;
DELETE FROM car_categories WHERE name NOT IN ('Sedan', 'SUV', 'Van', 'Luxury');

WITH target_branch AS (
    SELECT id FROM branches WHERE name = 'Chi nhánh Cầu Giấy' LIMIT 1
),
fleet(category_name, license_plate, brand, model, year_made, transmission, fuel_type, price_per_day, deposit, seats, description, image_url) AS (
    VALUES
    ('Sedan', '51K-101.01', 'Toyota', 'Vios', 2024, 'MANUAL', 'GASOLINE', 800000, 10000000, 5, 'Affordable sedan for city driving and short business trips.', 'https://upload.wikimedia.org/wikipedia/commons/e/e9/2022_Toyota_Vios_1.5_G_at_night.jpg'),
    ('Sedan', '51K-102.02', 'Hyundai', 'Accent', 2024, 'AUTO', 'GASOLINE', 850000, 10000000, 5, 'Compact sedan with good comfort and easy handling.', 'https://images.unsplash.com/photo-1503378414167-bd1ad040c5f0?q=80&w=1200&auto=format&fit=crop'),
    ('Sedan', '51K-103.03', 'Honda', 'City RS', 2024, 'AUTO', 'GASOLINE', 950000, 12000000, 5, 'Sporty sedan with modern safety features and roomy cabin.', 'https://upload.wikimedia.org/wikipedia/commons/4/43/HONDA_CITY_%28GM4%2CGM5%2CGM6%2CGM8%2CGM9%29_China_%284%29.jpg'),
    ('Sedan', '51K-104.04', 'Mazda', '3', 2024, 'AUTO', 'GASOLINE', 1100000, 15000000, 5, 'Premium compact sedan with stylish interior and smooth drive.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop'),
    ('Sedan', '51K-105.05', 'Toyota', 'Camry Hybrid', 2024, 'AUTO', 'HYBRID', 1800000, 25000000, 5, 'Executive sedan with hybrid efficiency and quiet comfort.', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1200&auto=format&fit=crop'),
    ('Sedan', '51K-106.06', 'BYD', 'Seal', 2024, 'AUTO', 'ELECTRIC', 1900000, 30000000, 5, 'Electric sedan with premium cabin and long-range city use.', 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-201.01', 'VinFast', 'VF 5', 2024, 'AUTO', 'ELECTRIC', 900000, 12000000, 5, 'Compact electric SUV suitable for city and daily rental.', 'https://images.unsplash.com/photo-1593941707882-a5bba53b0998?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-202.02', 'VinFast', 'VF e34', 2024, 'AUTO', 'ELECTRIC', 1100000, 15000000, 5, 'Electric SUV with spacious cabin and quiet operation.', 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-203.03', 'VinFast', 'VF 6', 2024, 'AUTO', 'ELECTRIC', 1300000, 18000000, 5, 'Modern electric crossover for family and urban trips.', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-204.04', 'Mitsubishi', 'Xforce', 2024, 'AUTO', 'GASOLINE', 1100000, 15000000, 5, 'Practical compact SUV with high ground clearance.', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-205.05', 'Mazda', 'CX-5', 2024, 'AUTO', 'GASOLINE', 1250000, 18000000, 5, 'Comfortable SUV with refined interior and stable handling.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-206.06', 'Hyundai', 'Tucson', 2024, 'AUTO', 'GASOLINE', 1300000, 18000000, 5, 'Mid-size SUV for families and longer highway travel.', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-207.07', 'Toyota', 'Corolla Cross Hybrid', 2024, 'AUTO', 'HYBRID', 1400000, 20000000, 5, 'Hybrid crossover with low fuel use and Toyota reliability.', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop'),
    ('SUV', '51K-208.08', 'Toyota', 'Fortuner', 2024, 'AUTO', 'DIESEL', 1600000, 25000000, 7, '7-seat SUV for long-distance and rougher road conditions.', 'https://upload.wikimedia.org/wikipedia/commons/8/8b/2021_Toyota_Fortuner_2.4_TRD_Sportivo_%28Indonesia%29_front_view.jpg'),
    ('SUV', '51K-209.09', 'Ford', 'Everest', 2024, 'AUTO', 'DIESEL', 1800000, 30000000, 7, 'Large 7-seat SUV with strong engine and high comfort.', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop'),
    ('Van', '51K-301.01', 'Mitsubishi', 'Xpander AT', 2024, 'AUTO', 'GASOLINE', 900000, 12000000, 7, 'Popular 7-seat MPV for family trips and airport pickup.', 'https://upload.wikimedia.org/wikipedia/commons/3/38/2023_Mitsubishi_Xpander_GT.jpg'),
    ('Van', '51K-302.02', 'Mitsubishi', 'Xpander MT', 2024, 'MANUAL', 'GASOLINE', 850000, 10000000, 7, 'Budget 7-seat MPV with manual transmission.', 'https://upload.wikimedia.org/wikipedia/commons/3/38/2023_Mitsubishi_Xpander_GT.jpg'),
    ('Van', '51K-303.03', 'Toyota', 'Veloz Cross', 2024, 'AUTO', 'GASOLINE', 1000000, 12000000, 7, 'Comfortable 7-seat family van with modern safety features.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop'),
    ('Van', '51K-304.04', 'Suzuki', 'XL7 Hybrid', 2024, 'AUTO', 'HYBRID', 950000, 12000000, 7, 'Efficient 7-seat hybrid MPV for family travel.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop'),
    ('Van', '51K-305.05', 'VinFast', 'Limo Green', 2025, 'AUTO', 'ELECTRIC', 1600000, 25000000, 7, 'Electric 7-seat van for group and premium city transport.', 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop'),
    ('Van', '51K-306.06', 'Kia', 'Carnival', 2024, 'AUTO', 'DIESEL', 2200000, 35000000, 8, 'Premium 8-seat MPV with business-class passenger comfort.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop'),
    ('Van', '51K-307.07', 'Maxus', 'Mifa 9', 2024, 'AUTO', 'ELECTRIC', 2800000, 45000000, 9, 'Large electric 9-seat van for groups and VIP transfer.', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop'),
    ('Luxury', '51K-401.01', 'Mercedes-Benz', 'C200', 2024, 'AUTO', 'GASOLINE', 3000000, 50000000, 5, 'Luxury sedan for business meetings and premium city use.', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop'),
    ('Luxury', '51K-402.02', 'BMW', '530i', 2024, 'AUTO', 'GASOLINE', 4500000, 70000000, 5, 'Executive luxury sedan with strong performance and comfort.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop'),
    ('Luxury', '51K-403.03', 'Mercedes-Benz', 'EQS 450+', 2024, 'AUTO', 'ELECTRIC', 8500000, 100000000, 5, 'Flagship electric luxury sedan for VIP rental.', 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop')
),
inserted AS (
    INSERT INTO cars (
        category_id, branch_id, license_plate, brand, model, year_made, transmission,
        fuel_type, price_per_day, deposit, status, seats, description
    )
    SELECT
        category.id,
        target_branch.id,
        fleet.license_plate,
        fleet.brand,
        fleet.model,
        fleet.year_made,
        fleet.transmission,
        fleet.fuel_type,
        fleet.price_per_day,
        fleet.deposit,
        'AVAILABLE',
        fleet.seats,
        fleet.description
    FROM fleet
    JOIN car_categories category ON category.name = fleet.category_name
    CROSS JOIN target_branch
    RETURNING id, license_plate
)
INSERT INTO car_images (car_id, image_url, is_primary, display_order)
SELECT inserted.id, fleet.image_url, TRUE, 0
FROM inserted
JOIN fleet ON fleet.license_plate = inserted.license_plate;

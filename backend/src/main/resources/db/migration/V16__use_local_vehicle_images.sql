WITH image_updates(license_plate, image_url) AS (
    VALUES
        ('51K-106.06', '/vehicles/byd-seal.jpg'),
        ('51K-105.05', '/vehicles/toyota-camry-2024.jpg'),
        ('51K-104.04', '/vehicles/mazda-3-2024.jpg'),
        ('51K-209.09', '/vehicles/ford-everest-2024.jpeg'),
        ('51K-207.07', '/vehicles/toyota-corolla-cross-hybrid-2024.webp'),
        ('51K-206.06', '/vehicles/hyundai-tucson-2024.jpg'),
        ('51K-205.05', '/vehicles/mazda-cx-5-2024.jpg'),
        ('51K-204.04', '/vehicles/mitsubishi-xforce-2024.jpg'),
        ('51K-203.03', '/vehicles/vinfast-vf6.webp'),
        ('51K-202.02', '/vehicles/vinfast-vfe34.jpg'),
        ('51K-307.07', '/vehicles/maxus-mifa-9.jpg'),
        ('51K-306.06', '/vehicles/kia-carnival-2024.jpg'),
        ('51K-305.05', '/vehicles/vinfast-limo-green.jpg'),
        ('51K-304.04', '/vehicles/suzuki-xl7-hybrid.jpg'),
        ('51K-303.03', '/vehicles/toyota-veloz-cross-2024.jpg'),
        ('51K-302.02', '/vehicles/mitsubishi-xpander-2024-mt.jpg'),
        ('51K-301.01', '/vehicles/mitsubishi-xpander-2024-at.jpg'),
        ('51K-403.03', '/vehicles/mercedes-benz-eqs-450.jpg'),
        ('51K-402.02', '/vehicles/bmw-530i.jpg'),
        ('51K-401.01', '/vehicles/mercedes-benz-c200-2024.webp')
)
UPDATE car_images image
SET image_url = image_updates.image_url
FROM cars car
JOIN image_updates ON image_updates.license_plate = car.license_plate
WHERE image.car_id = car.id
  AND image.is_primary = TRUE;

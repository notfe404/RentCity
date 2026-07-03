WITH image_updates(license_plate, image_url) AS (
    VALUES
        ('51K-102.02', 'https://upload.wikimedia.org/wikipedia/commons/6/6c/2020_Hyundai_Verna_Facelift_China_RC_%281%29.jpg'),
        ('51K-201.01', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/2025_VinFast_VF_5_in_Vinfast_Blue%2C_rear_right.jpg')
)
UPDATE car_images image
SET image_url = image_updates.image_url
FROM cars car
JOIN image_updates ON image_updates.license_plate = car.license_plate
WHERE image.car_id = car.id
  AND image.is_primary = TRUE;

-- Seed data for demo/testing purposes

-- Insert demo device models
INSERT INTO device_models (brand, model, category, description) VALUES
('Apple', 'MacBook Pro 14"', 'laptop', '14-inch MacBook Pro with M3 chip, 16GB RAM, 512GB SSD'),
('Apple', 'MacBook Air 13"', 'laptop', '13-inch MacBook Air with M2 chip, 8GB RAM, 256GB SSD'),
('Dell', 'XPS 15', 'laptop', '15.6-inch Windows laptop, Intel i7, 16GB RAM, 512GB SSD'),
('Lenovo', 'ThinkPad X1', 'laptop', '14-inch business laptop, Intel i7, 16GB RAM, 512GB SSD'),
('Apple', 'iPad Pro 12.9"', 'tablet', '12.9-inch iPad Pro with M2 chip, 256GB storage'),
('Apple', 'iPad Air', 'tablet', '10.9-inch iPad Air with M1 chip, 64GB storage'),
('Samsung', 'Galaxy Tab S9', 'tablet', '11-inch Android tablet, 128GB storage'),
('Canon', 'EOS R6', 'camera', 'Full-frame mirrorless camera with 20.1MP sensor'),
('Sony', 'A7 IV', 'camera', 'Full-frame mirrorless camera with 33MP sensor'),
('Nikon', 'Z6 II', 'camera', 'Full-frame mirrorless camera with 24.5MP sensor')
ON CONFLICT (brand, model) DO NOTHING;

-- Insert individual devices for each model
-- MacBook Pro 14" - 3 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'MBP14-001', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Pro 14"'
UNION ALL
SELECT id, 'MBP14-002', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Pro 14"'
UNION ALL
SELECT id, 'MBP14-003', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Pro 14"';

-- MacBook Air 13" - 5 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'MBA13-001', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Air 13"'
UNION ALL
SELECT id, 'MBA13-002', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Air 13"'
UNION ALL
SELECT id, 'MBA13-003', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Air 13"'
UNION ALL
SELECT id, 'MBA13-004', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Air 13"'
UNION ALL
SELECT id, 'MBA13-005', true, 'Fair' FROM device_models WHERE brand = 'Apple' AND model = 'MacBook Air 13"';

-- Dell XPS 15 - 4 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'XPS15-001', true, 'Excellent' FROM device_models WHERE brand = 'Dell' AND model = 'XPS 15'
UNION ALL
SELECT id, 'XPS15-002', true, 'Good' FROM device_models WHERE brand = 'Dell' AND model = 'XPS 15'
UNION ALL
SELECT id, 'XPS15-003', true, 'Good' FROM device_models WHERE brand = 'Dell' AND model = 'XPS 15'
UNION ALL
SELECT id, 'XPS15-004', true, 'Fair' FROM device_models WHERE brand = 'Dell' AND model = 'XPS 15';

-- ThinkPad X1 - 3 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'TPX1-001', true, 'Excellent' FROM device_models WHERE brand = 'Lenovo' AND model = 'ThinkPad X1'
UNION ALL
SELECT id, 'TPX1-002', true, 'Good' FROM device_models WHERE brand = 'Lenovo' AND model = 'ThinkPad X1'
UNION ALL
SELECT id, 'TPX1-003', true, 'Good' FROM device_models WHERE brand = 'Lenovo' AND model = 'ThinkPad X1';

-- iPad Pro 12.9" - 4 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'IPADPRO-001', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Pro 12.9"'
UNION ALL
SELECT id, 'IPADPRO-002', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Pro 12.9"'
UNION ALL
SELECT id, 'IPADPRO-003', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Pro 12.9"'
UNION ALL
SELECT id, 'IPADPRO-004', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Pro 12.9"';

-- iPad Air - 6 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'IPADAIR-001', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Air'
UNION ALL
SELECT id, 'IPADAIR-002', true, 'Excellent' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Air'
UNION ALL
SELECT id, 'IPADAIR-003', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Air'
UNION ALL
SELECT id, 'IPADAIR-004', true, 'Good' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Air'
UNION ALL
SELECT id, 'IPADAIR-005', true, 'Fair' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Air'
UNION ALL
SELECT id, 'IPADAIR-006', true, 'Fair' FROM device_models WHERE brand = 'Apple' AND model = 'iPad Air';

-- Samsung Galaxy Tab S9 - 3 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'TABS9-001', true, 'Excellent' FROM device_models WHERE brand = 'Samsung' AND model = 'Galaxy Tab S9'
UNION ALL
SELECT id, 'TABS9-002', true, 'Good' FROM device_models WHERE brand = 'Samsung' AND model = 'Galaxy Tab S9'
UNION ALL
SELECT id, 'TABS9-003', true, 'Good' FROM device_models WHERE brand = 'Samsung' AND model = 'Galaxy Tab S9';

-- Canon EOS R6 - 2 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'CANR6-001', true, 'Excellent' FROM device_models WHERE brand = 'Canon' AND model = 'EOS R6'
UNION ALL
SELECT id, 'CANR6-002', true, 'Good' FROM device_models WHERE brand = 'Canon' AND model = 'EOS R6';

-- Sony A7 IV - 2 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'SONYA7-001', true, 'Excellent' FROM device_models WHERE brand = 'Sony' AND model = 'A7 IV'
UNION ALL
SELECT id, 'SONYA7-002', true, 'Good' FROM device_models WHERE brand = 'Sony' AND model = 'A7 IV';

-- Nikon Z6 II - 2 units
INSERT INTO devices (device_model_id, serial_number, is_available, condition)
SELECT id, 'NIKZ6-001', true, 'Excellent' FROM device_models WHERE brand = 'Nikon' AND model = 'Z6 II'
UNION ALL
SELECT id, 'NIKZ6-002', true, 'Good' FROM device_models WHERE brand = 'Nikon' AND model = 'Z6 II';

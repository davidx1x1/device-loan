-- Seed data for testing the Device Loan Management System
-- Run this after the initial migration

-- Insert sample device models
INSERT INTO device_models (id, brand, model, category, description, image_url) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Apple', 'MacBook Pro 14"', 'laptop', '14-inch MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Apple', 'MacBook Air 13"', 'laptop', '13-inch MacBook Air with M2 chip, 8GB RAM, 256GB SSD', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Dell', 'XPS 13', 'laptop', 'Dell XPS 13 with Intel i7, 16GB RAM, 512GB SSD', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Apple', 'iPad Pro 12.9"', 'tablet', '12.9-inch iPad Pro with M2 chip, 256GB', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Samsung', 'Galaxy Tab S9', 'tablet', 'Samsung Galaxy Tab S9 with 128GB storage', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Canon', 'EOS R6 Mark II', 'camera', 'Full-frame mirrorless camera with 24.2MP sensor', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Sony', 'Alpha a7 IV', 'camera', 'Full-frame camera with 33MP sensor and 4K video', 'https://images.unsplash.com/photo-1606980623314-fdc0c36dc07d?w=800'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Microsoft', 'Surface Pro 9', 'tablet', 'Surface Pro 9 with Intel i7, 16GB RAM', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800');

-- Insert individual devices for MacBook Pro 14"
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MBP14-001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MBP14-002', true, 'Good condition, minor scratches'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MBP14-003', true, 'Excellent condition');

-- Insert individual devices for MacBook Air 13"
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'MBA13-001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'MBA13-002', true, 'Good condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'MBA13-003', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'MBA13-004', true, 'Fair condition, some wear');

-- Insert individual devices for Dell XPS 13
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'XPS13-001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'XPS13-002', true, 'Good condition');

-- Insert individual devices for iPad Pro 12.9"
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'IPAD-001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'IPAD-002', true, 'Good condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'IPAD-003', true, 'Excellent condition');

-- Insert individual devices for Samsung Galaxy Tab S9
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'STAB-001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'STAB-002', true, 'Good condition');

-- Insert individual devices for Canon EOS R6 Mark II
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'CAM-C001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'CAM-C002', true, 'Good condition');

-- Insert individual devices for Sony Alpha a7 IV
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'CAM-S001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'CAM-S002', true, 'Good condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'CAM-S003', true, 'Fair condition');

-- Insert individual devices for Microsoft Surface Pro 9
INSERT INTO devices (device_model_id, serial_number, is_available, condition) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'SURF-001', true, 'Excellent condition'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'SURF-002', true, 'Good condition');

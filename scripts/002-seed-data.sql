-- Insert sample users
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@pharmacy.com', '$2b$10$hash', 'admin'),
('manager', 'manager@pharmacy.com', '$2b$10$hash', 'manager'),
('cashier1', 'cashier1@pharmacy.com', '$2b$10$hash', 'cashier'),
('cashier2', 'cashier2@pharmacy.com', '$2b$10$hash', 'cashier');

-- Insert sample families
INSERT INTO families (name) VALUES
('Antibiotics'),
('Pain Relief'),
('Vitamins'),
('Cardiovascular'),
('Respiratory'),
('Digestive');

-- Insert sample units
INSERT INTO units (name, conversion_ratio) VALUES
('Tablet', 1.0000),
('Capsule', 1.0000),
('ml', 1.0000),
('mg', 0.0010),
('g', 1.0000),
('Box', 1.0000);

-- Insert sample suppliers
INSERT INTO suppliers (name, phone, address) VALUES
('PharmaCorp Ltd', '+1234567890', '123 Medical Street, Health City'),
('MediSupply Inc', '+1234567891', '456 Pharma Avenue, Medicine Town'),
('HealthDistributors', '+1234567892', '789 Drug Boulevard, Wellness City');

-- Insert sample medications
INSERT INTO medications (code, name, description, dosage_form, alert_level, family_id, unit_id, price, stock_quantity) VALUES
('MED001', 'Amoxicillin 500mg', 'Antibiotic for bacterial infections', 'Capsule', 20, 1, 2, 0.50, 150),
('MED002', 'Paracetamol 500mg', 'Pain relief and fever reducer', 'Tablet', 50, 2, 1, 0.25, 300),
('MED003', 'Vitamin C 1000mg', 'Immune system support', 'Tablet', 30, 3, 1, 0.75, 200),
('MED004', 'Lisinopril 10mg', 'ACE inhibitor for hypertension', 'Tablet', 15, 4, 1, 1.25, 80),
('MED005', 'Salbutamol Inhaler', 'Bronchodilator for asthma', 'Inhaler', 10, 5, 6, 15.00, 25),
('MED006', 'Omeprazole 20mg', 'Proton pump inhibitor', 'Capsule', 25, 6, 2, 0.85, 120);

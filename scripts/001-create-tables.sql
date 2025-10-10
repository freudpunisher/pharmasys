-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  conversion_ratio DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  dosage_form VARCHAR(50) NOT NULL,
  alert_level INTEGER NOT NULL DEFAULT 10,
  family_id INTEGER REFERENCES families(id),
  unit_id INTEGER REFERENCES units(id),
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INTEGER REFERENCES purchases(id) NOT NULL,
  medication_id INTEGER REFERENCES medications(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  expiry_date TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sale_date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) NOT NULL,
  medication_id INTEGER REFERENCES medications(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Create inventories table
CREATE TABLE IF NOT EXISTS inventories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  inventory_date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventories(id) NOT NULL,
  medication_id INTEGER REFERENCES medications(id) NOT NULL,
  expected_quantity INTEGER NOT NULL,
  counted_quantity INTEGER NOT NULL,
  difference INTEGER NOT NULL
);

-- Create losses table
CREATE TABLE IF NOT EXISTS losses (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medications(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  quantity INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  loss_date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

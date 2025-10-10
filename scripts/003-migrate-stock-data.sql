-- Migration script to populate stock table with existing data
-- This should be run after the drizzle migration to preserve existing stock quantities

-- First, let's check if we have any existing medications with stock_quantity
-- (This assumes the migration hasn't been run yet and stock_quantity still exists)

-- Insert stock records for existing medications
-- Note: This script should be run BEFORE the drizzle migration if stock_quantity exists
-- or adjusted to use default values if the column has already been dropped

INSERT INTO stock (medication_id, current_quantity, reserved_quantity, last_updated, created_at)
SELECT 
    id as medication_id,
    COALESCE(stock_quantity, 0) as current_quantity,
    0 as reserved_quantity,
    NOW() as last_updated,
    NOW() as created_at
FROM medications
WHERE NOT EXISTS (
    SELECT 1 FROM stock WHERE stock.medication_id = medications.id
);

-- Alternative approach if stock_quantity column has already been dropped:
-- This will initialize all existing medications with 0 stock
/*
INSERT INTO stock (medication_id, current_quantity, reserved_quantity, last_updated, created_at)
SELECT 
    id as medication_id,
    0 as current_quantity,
    0 as reserved_quantity,
    NOW() as last_updated,
    NOW() as created_at
FROM medications
WHERE NOT EXISTS (
    SELECT 1 FROM stock WHERE stock.medication_id = medications.id
);
*/

-- Create trigger to automatically create stock record when new medication is added
CREATE OR REPLACE FUNCTION create_stock_for_new_medication()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock (medication_id, current_quantity, reserved_quantity, last_updated, created_at)
    VALUES (NEW.id, 0, 0, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS medication_stock_trigger ON medications;
CREATE TRIGGER medication_stock_trigger
    AFTER INSERT ON medications
    FOR EACH ROW
    EXECUTE FUNCTION create_stock_for_new_medication();

-- Create function to update stock levels
CREATE OR REPLACE FUNCTION update_stock_quantity(
    p_medication_id INTEGER,
    p_quantity_change INTEGER,
    p_operation_type VARCHAR(20) -- 'purchase', 'sale', 'adjustment', 'loss'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_qty INTEGER;
BEGIN
    -- Get current quantity
    SELECT current_quantity INTO current_qty 
    FROM stock 
    WHERE medication_id = p_medication_id;
    
    -- Check if medication exists in stock
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Medication ID % not found in stock', p_medication_id;
    END IF;
    
    -- For sales and losses, check if we have enough stock
    IF p_operation_type IN ('sale', 'loss') AND (current_qty + p_quantity_change) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for medication ID %. Available: %, Requested: %', 
                       p_medication_id, current_qty, ABS(p_quantity_change);
    END IF;
    
    -- Update stock quantity
    UPDATE stock 
    SET 
        current_quantity = current_quantity + p_quantity_change,
        last_updated = NOW()
    WHERE medication_id = p_medication_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
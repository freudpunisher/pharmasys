# Stock Management System

## Overview

The pharmacy management system now includes a dedicated stock management system that separates product catalog information from inventory quantities. This provides better data organization, audit trails, and inventory control.

## Architecture Changes

### Before (Old System)
- `medications` table contained `stock_quantity` field
- Stock updates were made directly to the medications table
- No separate tracking of stock movements

### After (New System)
- `medications` table contains only product information
- New `stock` table tracks current quantities separately
- Automatic triggers create stock records for new medications
- Dedicated API endpoints for stock operations

## Database Schema

### Stock Table
```sql
CREATE TABLE stock (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER UNIQUE NOT NULL REFERENCES medications(id),
  current_quantity INTEGER DEFAULT 0 NOT NULL,
  reserved_quantity INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Key Features
- **current_quantity**: Available stock quantity
- **reserved_quantity**: Stock reserved for pending orders
- **Unique constraint**: One stock record per medication
- **Automatic triggers**: Stock records created automatically for new medications

## API Endpoints

### Stock API (`/api/stock`)

#### GET - Fetch Stock Levels
```javascript
// Get all stock levels
GET /api/stock

// Get only items with low stock
GET /api/stock?lowStock=true
```

#### POST - Update Stock Quantity
```javascript
POST /api/stock
{
  "medicationId": 1,
  "quantityChange": 50,  // Positive for increase, negative for decrease
  "operationType": "purchase", // purchase, sale, adjustment, loss
  "reason": "Stock replenishment"
}
```

#### PUT - Set Exact Stock Quantity
```javascript
PUT /api/stock
{
  "medicationId": 1,
  "newQuantity": 100,
  "reason": "Inventory count adjustment"
}
```

### Updated Existing APIs

#### Medications API (`/api/medications`)
- Now joins with stock table to return current quantities
- POST endpoint creates stock record automatically
- Accepts `initialStock` parameter for new medications

#### Sales API (`/api/sales`)
- Validates stock availability before processing
- Updates stock table instead of medications table
- Better error messages for insufficient stock

#### Purchases API (`/api/purchases`)
- Updates stock table when processing purchases
- Automatically increases stock quantities

## Frontend Integration

### Stock Service
A new `stockService` utility provides methods for:
- Fetching stock levels
- Updating stock quantities
- Processing sales and purchases
- Recording losses
- Checking stock availability

```typescript
import stockService from '@/lib/stockService';

// Check stock levels
const stockLevels = await stockService.getStockLevels();

// Process a sale
await stockService.processSale([
  { medicationId: 1, quantity: 5 },
  { medicationId: 2, quantity: 3 }
]);

// Record a loss
await stockService.recordLoss(1, 10, 'Expired medication');
```

### Component Updates
- Sale module now uses stock-aware medication data
- Purchase module automatically updates stock
- Inventory components show real-time stock levels

## Migration Process

### Automatic Migration
Run the setup script to migrate existing data:

```bash
./scripts/setup-stock-system.sh
```

This script:
1. Runs database migrations
2. Creates stock records for existing medications
3. Sets up triggers and functions
4. Preserves existing stock quantities

### Manual Migration Steps
If you prefer manual control:

1. **Run Drizzle migration:**
   ```bash
   npx drizzle-kit push
   ```

2. **Execute stock setup script:**
   ```bash
   psql $DATABASE_URL -f scripts/003-migrate-stock-data.sql
   ```

3. **Verify migration:**
   ```sql
   SELECT COUNT(*) FROM stock;
   SELECT COUNT(*) FROM medications;
   ```

## Benefits

### 1. **Better Data Organization**
- Product information separated from inventory data
- Cleaner database schema
- Easier to maintain and extend

### 2. **Enhanced Inventory Control**
- Reserved quantities for pending orders
- Real-time stock validation
- Automatic low-stock detection

### 3. **Audit Trail**
- All stock changes are timestamped
- Operation types tracked (purchase, sale, loss, adjustment)
- Better compliance and reporting

### 4. **Improved Performance**
- Optimized queries for stock operations
- Reduced table locking during updates
- Better indexing strategies

### 5. **Scalability**
- Support for future features like batch tracking
- Multi-location inventory support
- Advanced reporting capabilities

## Usage Examples

### Creating a New Medication
```typescript
// Medication is created with 0 stock automatically
const response = await axiosInstance.post('/api/medications', {
  code: 'MED001',
  name: 'Aspirin 325mg',
  price: '0.50',
  alertLevel: 20,
  initialStock: 0  // Optional, defaults to 0
});
```

### Processing a Purchase
```typescript
// Stock is automatically updated when purchase is processed
const purchase = await axiosInstance.post('/api/purchases', {
  supplierId: 1,
  items: [
    { medicationId: 1, quantity: 100, unitPrice: 0.45 }
  ],
  purchaseDate: new Date().toISOString()
});
```

### Processing a Sale
```typescript
// Stock validation and update handled automatically
const sale = await axiosInstance.post('/api/sales', {
  userId: 1,
  items: [
    { medicationId: 1, quantity: 5, unitPrice: 0.50 }
  ],
  taxAmount: 0.25,
  discountAmount: 0
});
```

### Checking Low Stock
```typescript
// Get items below alert level
const lowStockItems = await stockService.getStockLevels(true);

lowStockItems.forEach(item => {
  if (item.currentQuantity <= item.medication.alertLevel) {
    console.log(`Low stock alert: ${item.medication.name}`);
  }
});
```

## Best Practices

### 1. **Always Use Stock API for Quantity Changes**
- Don't directly update the stock table
- Use the stock API endpoints for all operations
- This ensures proper validation and logging

### 2. **Handle Stock Validation**
- Check stock availability before processing sales
- Provide clear error messages for insufficient stock
- Consider implementing stock reservations for pending orders

### 3. **Monitor Low Stock**
- Regularly check for items below alert levels
- Set up automated notifications
- Use the low stock API endpoint for reports

### 4. **Audit Trail**
- Keep track of who made stock changes
- Log reasons for adjustments
- Regular stock reconciliation

## Troubleshooting

### Common Issues

**1. Stock record not found**
```
Error: Medication not found in stock
```
**Solution:** Ensure stock record exists or create one manually:
```sql
INSERT INTO stock (medication_id, current_quantity) VALUES (1, 0);
```

**2. Insufficient stock error**
```
Error: Insufficient stock. Available: 5, Requested: 10
```
**Solution:** Check actual stock levels and adjust quantities or restock.

**3. Migration issues**
```
Error: column "stock_quantity" does not exist
```
**Solution:** Ensure migration completed successfully and restart the application.

## Future Enhancements

### Planned Features
- **Batch/Lot tracking**: Track medications by batch numbers
- **Multi-location support**: Separate stock for different pharmacy locations
- **Stock movement history**: Detailed audit trail of all stock changes
- **Automated reordering**: Automatic purchase orders for low stock items
- **Expiry date tracking**: Monitor and alert for expiring medications

### API Extensions
- Real-time stock notifications via WebSocket
- Bulk stock operations
- Stock forecasting and analytics
- Integration with supplier APIs for automated ordering

---

For questions or issues with the stock system, please check the API documentation or create an issue in the project repository.
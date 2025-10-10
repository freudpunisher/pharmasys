import axiosInstance from './axiosInstance';

export interface StockOperation {
  medicationId: number;
  quantityChange: number;
  operationType: 'purchase' | 'sale' | 'adjustment' | 'loss';
  reason?: string;
}

export interface StockLevel {
  id: number;
  medicationId: number;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
  medication: {
    id: number;
    code: string;
    name: string;
    alertLevel: number;
    price: string;
    family: string | null;
    unit: string | null;
  };
}

export interface StockResponse {
  success: boolean;
  stock: {
    id: number;
    medicationId: number;
    currentQuantity: number;
    reservedQuantity: number;
    lastUpdated: string;
  };
  operation: {
    medicationId: number;
    quantityChange?: number;
    newQuantity?: number;
    operationType: string;
    reason?: string;
    timestamp: string;
  };
}

class StockService {
  /**
   * Get all stock levels
   * @param lowStock - Filter for items with low stock
   * @returns Promise of stock levels
   */
  async getStockLevels(lowStock = false): Promise<StockLevel[]> {
    try {
      const response = await axiosInstance.get('/api/stock', {
        params: { lowStock: lowStock.toString() }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      throw error;
    }
  }

  /**
   * Update stock quantity (for purchases, sales, adjustments)
   * @param operation - Stock operation details
   * @returns Promise of updated stock
   */
  async updateStock(operation: StockOperation): Promise<StockResponse> {
    try {
      const response = await axiosInstance.post('/api/stock', operation);
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Set exact stock quantity (for inventory adjustments)
   * @param medicationId - ID of the medication
   * @param newQuantity - New exact quantity
   * @param reason - Reason for adjustment
   * @returns Promise of updated stock
   */
  async setStockQuantity(medicationId: number, newQuantity: number, reason?: string): Promise<StockResponse> {
    try {
      const response = await axiosInstance.put('/api/stock', {
        medicationId,
        newQuantity,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error setting stock quantity:', error);
      throw error;
    }
  }

  /**
   * Process sale - reduces stock for multiple items
   * @param items - Array of sale items
   * @returns Promise of results
   */
  async processSale(items: Array<{ medicationId: number; quantity: number }>): Promise<StockResponse[]> {
    const results: StockResponse[] = [];
    
    for (const item of items) {
      try {
        const result = await this.updateStock({
          medicationId: item.medicationId,
          quantityChange: -item.quantity,
          operationType: 'sale',
          reason: 'Point of sale transaction'
        });
        results.push(result);
      } catch (error) {
        console.error(`Error processing sale for medication ${item.medicationId}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Process purchase - increases stock for multiple items
   * @param items - Array of purchase items
   * @returns Promise of results
   */
  async processPurchase(items: Array<{ medicationId: number; quantity: number }>): Promise<StockResponse[]> {
    const results: StockResponse[] = [];
    
    for (const item of items) {
      try {
        const result = await this.updateStock({
          medicationId: item.medicationId,
          quantityChange: item.quantity,
          operationType: 'purchase',
          reason: 'Purchase order received'
        });
        results.push(result);
      } catch (error) {
        console.error(`Error processing purchase for medication ${item.medicationId}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Record loss - reduces stock due to expiry, damage, theft, etc.
   * @param medicationId - ID of the medication
   * @param quantity - Quantity lost
   * @param reason - Reason for loss
   * @returns Promise of updated stock
   */
  async recordLoss(medicationId: number, quantity: number, reason: string): Promise<StockResponse> {
    try {
      const result = await this.updateStock({
        medicationId,
        quantityChange: -quantity,
        operationType: 'loss',
        reason
      });
      return result;
    } catch (error) {
      console.error(`Error recording loss for medication ${medicationId}:`, error);
      throw error;
    }
  }

  /**
   * Check if sufficient stock is available for a sale
   * @param items - Array of items to check
   * @param medications - Current medications with stock info
   * @returns Object with availability status and details
   */
  checkStockAvailability(
    items: Array<{ medicationId: number; quantity: number }>, 
    medications: Array<{ id: number; stockQuantity: number; name: string }>
  ): { available: boolean; insufficientItems: Array<{ name: string; requested: number; available: number }> } {
    const insufficientItems: Array<{ name: string; requested: number; available: number }> = [];
    
    items.forEach(item => {
      const medication = medications.find(med => med.id === item.medicationId);
      if (!medication) {
        insufficientItems.push({
          name: `Unknown medication (ID: ${item.medicationId})`,
          requested: item.quantity,
          available: 0
        });
      } else if (medication.stockQuantity < item.quantity) {
        insufficientItems.push({
          name: medication.name,
          requested: item.quantity,
          available: medication.stockQuantity
        });
      }
    });
    
    return {
      available: insufficientItems.length === 0,
      insufficientItems
    };
  }
}

export const stockService = new StockService();
export default stockService;
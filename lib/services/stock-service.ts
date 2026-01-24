import { db } from "@/lib/db";
import { stockMovements } from "@/lib/db/schema";

export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'loss' | 'return';
export type ReferenceType = 'sale' | 'purchase' | 'inventory' | 'loss';

interface RecordMovementParams {
    medicationId: number;
    type: MovementType;
    quantity: number;
    referenceId?: number;
    referenceType?: ReferenceType;
    reason?: string;
}

/**
 * Records a stock movement in the database.
 * This should be called whenever medication stock is added, removed, or adjusted.
 */
export async function recordStockMovement(params: RecordMovementParams, tx?: any) {
    const database = tx || db;

    await database.insert(stockMovements).values({
        medicationId: params.medicationId,
        type: params.type,
        quantity: params.quantity,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        reason: params.reason,
    });
}

/**
 * Records multiple stock movements as part of a single transaction if needed.
 */
export async function recordBulkStockMovements(movements: RecordMovementParams[], tx?: any) {
    const database = tx || db;

    if (movements.length === 0) return;

    await database.insert(stockMovements).values(movements.map(m => ({
        medicationId: m.medicationId,
        type: m.type,
        quantity: m.quantity,
        referenceId: m.referenceId,
        referenceType: m.referenceType,
        reason: m.reason,
    })));
}

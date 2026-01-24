import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockMovements, medications } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const type = searchParams.get("type");
        const medicationId = searchParams.get("medicationId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const offset = (page - 1) * limit;

        let query: any = db
            .select({
                id: stockMovements.id,
                medicationId: stockMovements.medicationId,
                medicationName: medications.name,
                type: stockMovements.type,
                quantity: stockMovements.quantity,
                referenceId: stockMovements.referenceId,
                referenceType: stockMovements.referenceType,
                reason: stockMovements.reason,
                createdAt: stockMovements.createdAt,
            })
            .from(stockMovements)
            .leftJoin(medications, eq(stockMovements.medicationId, medications.id))
            .orderBy(desc(stockMovements.createdAt))
            .limit(limit)
            .offset(offset);

        const conditions = [];
        if (type && type !== "all") conditions.push(eq(stockMovements.type, type));
        if (medicationId) conditions.push(eq(stockMovements.medicationId, parseInt(medicationId)));
        if (startDate) conditions.push(gte(stockMovements.createdAt, new Date(startDate)));
        if (endDate) conditions.push(lte(stockMovements.createdAt, new Date(endDate)));

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        let countQuery: any = db
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(stockMovements);

        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }

        const [movements, totalResult] = await Promise.all([query, countQuery]);

        const totalCount = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            movements,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    } catch (error: any) {
        console.error("GET /api/stock-movements error:", error);
        return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
    }
}

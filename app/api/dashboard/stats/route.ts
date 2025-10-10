import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sales, purchases, medications, losses } from "@/lib/db/schema"
import { sql, gte, lt } from "drizzle-orm"

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Today's sales
    const todaySales = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(gte(sales.saleDate, today))

    // Today's purchases
    const todayPurchases = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(gte(purchases.purchaseDate, today))

    // Total stock value
    const stockValue = await db
      .select({
        total: sql<number>`COALESCE(SUM(${medications.price} * ${medications.stockQuantity}), 0)`,
      })
      .from(medications)

    // Low stock items
    const lowStockItems = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(medications)
      .where(lt(medications.stockQuantity, medications.alertLevel))

    // Today's losses
    const todayLosses = await db
      .select({
        total: sql<number>`COALESCE(SUM(${losses.value}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(losses)
      .where(gte(losses.lossDate, today))

    return NextResponse.json({
      todaySales: {
        amount: todaySales[0]?.total || 0,
        count: todaySales[0]?.count || 0,
      },
      todayPurchases: {
        amount: todayPurchases[0]?.total || 0,
        count: todayPurchases[0]?.count || 0,
      },
      stockValue: stockValue[0]?.total || 0,
      lowStockCount: lowStockItems[0]?.count || 0,
      todayLosses: {
        amount: todayLosses[0]?.total || 0,
        count: todayLosses[0]?.count || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}

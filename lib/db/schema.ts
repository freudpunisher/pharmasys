import { pgTable, serial, varchar, text, integer, decimal, timestamp, numeric } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("cashier"), // admin, manager, cashier
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Families table
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Units table
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  conversionRatio: decimal("conversion_ratio", { precision: 10, scale: 4 }).notNull().default("1.0000"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Medications table
export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  dosageForm: varchar('dosage_form', { length: 100 }),
  alertLevel: integer('alert_level').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  family: varchar('family', { length: 255 }),
  unit: varchar('unit', { length: 50 }),
  familyId: integer('family_id').references(() => families.id),
  unitId: integer('unit_id').references(() => units.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Stock table - tracks current quantities for each medication
export const stock = pgTable('stock', {
  id: serial('id').primaryKey(),
  medicationId: integer('medication_id').notNull().references(() => medications.id).unique(),
  currentQuantity: integer('current_quantity').notNull().default(0),
  reservedQuantity: integer('reserved_quantity').notNull().default(0), // For pending orders
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  expiryDate: timestamp("expiry_date"),
});

// Sales table
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  saleDate: timestamp('sale_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sale items table
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
});

// Inventories table
export const inventories = pgTable("inventories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress, completed
  inventoryDate: timestamp("inventory_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id")
    .references(() => inventories.id)
    .notNull(),
  medicationId: integer("medication_id")
    .references(() => medications.id)
    .notNull(),
  expectedQuantity: integer("expected_quantity").notNull(),
  countedQuantity: integer("counted_quantity").notNull(),
  difference: integer("difference").notNull(),
})

// Losses table
export const losses = pgTable("losses", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id")
    .references(() => medications.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(), // expired, damaged, theft, etc.
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  lossDate: timestamp("loss_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  inventories: many(inventories),
  losses: many(losses),
}))

export const familiesRelations = relations(families, ({ many }) => ({
  medications: many(medications),
}))

export const unitsRelations = relations(units, ({ many }) => ({
  medications: many(medications),
}))

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}))

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  family: one(families, {
    fields: [medications.familyId],
    references: [families.id],
  }),
  unit: one(units, {
    fields: [medications.unitId],
    references: [units.id],
  }),
  stock: one(stock, {
    fields: [medications.id],
    references: [stock.medicationId],
  }),
  purchaseItems: many(purchaseItems),
  saleItems: many(saleItems),
  inventoryItems: many(inventoryItems),
  losses: many(losses),
}))

export const stockRelations = relations(stock, ({ one }) => ({
  medication: one(medications, {
    fields: [stock.medicationId],
    references: [medications.id],
  }),
}))

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseItems),
}))

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  medication: one(medications, {
    fields: [purchaseItems.medicationId],
    references: [medications.id],
  }),
}))

export const salesRelations = relations(sales, ({ one, many }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  medication: one(medications, {
    fields: [saleItems.medicationId],
    references: [medications.id],
  }),
}))

export const inventoriesRelations = relations(inventories, ({ one, many }) => ({
  user: one(users, {
    fields: [inventories.userId],
    references: [users.id],
  }),
  items: many(inventoryItems),
}))

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  inventory: one(inventories, {
    fields: [inventoryItems.inventoryId],
    references: [inventories.id],
  }),
  medication: one(medications, {
    fields: [inventoryItems.medicationId],
    references: [medications.id],
  }),
}))

export const lossesRelations = relations(losses, ({ one }) => ({
  medication: one(medications, {
    fields: [losses.medicationId],
    references: [medications.id],
  }),
  user: one(users, {
    fields: [losses.userId],
    references: [users.id],
  }),
}))

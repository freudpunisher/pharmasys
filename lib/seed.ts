import { db } from "./db/index";
import { users, families, units, suppliers, medications, stock, purchases, purchaseItems, sales, saleItems, inventories, inventoryItems, losses } from "./db/schema";
import * as bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🧹 Cleaning existing data...");
    
    // Clear existing data (optional, removes all data to start fresh)
    await db.delete(losses);
    await db.delete(inventoryItems);
    await db.delete(inventories);
    await db.delete(saleItems);
    await db.delete(sales);
    await db.delete(purchaseItems);
    await db.delete(purchases);
    await db.delete(stock); // Clear stock records
    await db.delete(medications);
    await db.delete(suppliers);
    await db.delete(units);
    await db.delete(families);
    await db.delete(users);
    
    console.log("✅ Data cleared successfully!");

    console.log("👥 Creating users...");
    
    // Insert users
    const hashedPassword = await bcrypt.hash("password123", 10);
    const insertedUsers = await db.insert(users).values([
      {
        username: "admin",
        email: "admin@pharmacy.com",
        password: hashedPassword,
        role: "admin",
      },
      {
        username: "manager",
        email: "manager@pharmacy.com",
        password: hashedPassword,
        role: "manager",
      },
      {
        username: "cashier1",
        email: "cashier1@pharmacy.com",
        password: hashedPassword,
        role: "cashier",
      },
      {
        username: "cashier2",
        email: "cashier2@pharmacy.com",
        password: hashedPassword,
        role: "cashier",
      },
    ]).returning();

    const adminId = insertedUsers.find(u => u.username === "admin")!.id;
    const managerId = insertedUsers.find(u => u.username === "manager")!.id;
    const cashier1Id = insertedUsers.find(u => u.username === "cashier1")!.id;
    const cashier2Id = insertedUsers.find(u => u.username === "cashier2")!.id;
    
    console.log("👨‍⚕️ Created users:", insertedUsers.map(u => u.username));

    console.log("🏥 Creating medication families...");
    
    // Insert families
    const insertedFamilies = await db.insert(families).values([
      { name: "Antibiotics" },
      { name: "Pain Relief" },
      { name: "Vitamins" },
      { name: "Cardiovascular" },
      { name: "Respiratory" },
      { name: "Digestive" },
      { name: "Antifungal" },
      { name: "Antiseptic" },
    ]).returning();

    const antibioticsId = insertedFamilies.find(f => f.name === "Antibiotics")!.id;
    const painReliefId = insertedFamilies.find(f => f.name === "Pain Relief")!.id;
    const vitaminsId = insertedFamilies.find(f => f.name === "Vitamins")!.id;
    const cardiovascularId = insertedFamilies.find(f => f.name === "Cardiovascular")!.id;
    const respiratoryId = insertedFamilies.find(f => f.name === "Respiratory")!.id;
    const digestiveId = insertedFamilies.find(f => f.name === "Digestive")!.id;
    const antifungalId = insertedFamilies.find(f => f.name === "Antifungal")!.id;
    const antisepticId = insertedFamilies.find(f => f.name === "Antiseptic")!.id;
    
    console.log("🏷️ Created families:", insertedFamilies.map(f => f.name));

    console.log("📏 Creating units of measurement...");
    
    // Insert units
    const insertedUnits = await db.insert(units).values([
      { name: "Tablet", conversionRatio: "1.0000" },
      { name: "Capsule", conversionRatio: "1.0000" },
      { name: "ml", conversionRatio: "1.0000" },
      { name: "mg", conversionRatio: "0.0010" },
      { name: "g", conversionRatio: "1.0000" },
      { name: "Box", conversionRatio: "1.0000" },
      { name: "Bottle", conversionRatio: "100.0000" },
      { name: "Tube", conversionRatio: "1.0000" },
      { name: "Vial", conversionRatio: "1.0000" },
    ]).returning();

    const tabletId = insertedUnits.find(u => u.name === "Tablet")!.id;
    const capsuleId = insertedUnits.find(u => u.name === "Capsule")!.id;
    const mlId = insertedUnits.find(u => u.name === "ml")!.id;
    const mgId = insertedUnits.find(u => u.name === "mg")!.id;
    const boxId = insertedUnits.find(u => u.name === "Box")!.id;
    const bottleId = insertedUnits.find(u => u.name === "Bottle")!.id;
    const tubeId = insertedUnits.find(u => u.name === "Tube")!.id;
    
    console.log("📦 Created units:", insertedUnits.map(u => u.name));

    console.log("🏪 Creating suppliers...");
    
    // Insert suppliers
    const insertedSuppliers = await db.insert(suppliers).values([
      { name: "PharmaCorp Ltd", phone: "+1234567890", address: "123 Medical Street, Health City" },
      { name: "MediSupply Inc", phone: "+1234567891", address: "456 Pharma Avenue, Medicine Town" },
      { name: "HealthDistributors", phone: "+1234567892", address: "789 Drug Boulevard, Wellness City" },
      { name: "Global Pharma Solutions", phone: "+1234567893", address: "321 Healthcare Plaza, Medical District" },
    ]).returning();

    const pharmaCorpId = insertedSuppliers.find(s => s.name === "PharmaCorp Ltd")!.id;
    const mediSupplyId = insertedSuppliers.find(s => s.name === "MediSupply Inc")!.id;
    const healthDistId = insertedSuppliers.find(s => s.name === "HealthDistributors")!.id;
    
    console.log("🏭 Created suppliers:", insertedSuppliers.map(s => s.name));

    console.log("💊 Creating medications...");
    
    // Insert medications (without stockQuantity as it's now in separate stock table)
    const insertedMedications = await db.insert(medications).values([
      {
        code: "MED001",
        name: "Amoxicillin 500mg",
        description: "Antibiotic for bacterial infections",
        dosageForm: "Capsule",
        alertLevel: 20,
        familyId: antibioticsId,
        unitId: capsuleId,
        price: "0.50",
      },
      {
        code: "MED002",
        name: "Paracetamol 500mg",
        description: "Pain relief and fever reducer",
        dosageForm: "Tablet",
        alertLevel: 50,
        familyId: painReliefId,
        unitId: tabletId,
        price: "0.25",
      },
      {
        code: "MED003",
        name: "Vitamin C 1000mg",
        description: "Immune system support",
        dosageForm: "Tablet",
        alertLevel: 30,
        familyId: vitaminsId,
        unitId: tabletId,
        price: "0.75",
      },
      {
        code: "MED004",
        name: "Lisinopril 10mg",
        description: "ACE inhibitor for hypertension",
        dosageForm: "Tablet",
        alertLevel: 15,
        familyId: cardiovascularId,
        unitId: tabletId,
        price: "1.25",
      },
      {
        code: "MED005",
        name: "Salbutamol Inhaler",
        description: "Bronchodilator for asthma",
        dosageForm: "Inhaler",
        alertLevel: 10,
        familyId: respiratoryId,
        unitId: boxId,
        price: "15.00",
      },
      {
        code: "MED006",
        name: "Omeprazole 20mg",
        description: "Proton pump inhibitor",
        dosageForm: "Capsule",
        alertLevel: 25,
        familyId: digestiveId,
        unitId: capsuleId,
        price: "0.85",
      },
      {
        code: "MED007",
        name: "Ibuprofen 400mg",
        description: "Pain relief and anti-inflammatory",
        dosageForm: "Tablet",
        alertLevel: 40,
        familyId: painReliefId,
        unitId: tabletId,
        price: "0.30",
      },
      {
        code: "MED008",
        name: "Cough Syrup 100ml",
        description: "Relief from cough and cold symptoms",
        dosageForm: "Syrup",
        alertLevel: 20,
        familyId: respiratoryId,
        unitId: bottleId,
        price: "8.50",
      },
      {
        code: "MED009",
        name: "Antifungal Cream 30g",
        description: "Topical treatment for fungal infections",
        dosageForm: "Cream",
        alertLevel: 15,
        familyId: antifungalId,
        unitId: tubeId,
        price: "12.00",
      },
      {
        code: "MED010",
        name: "Antiseptic Solution 250ml",
        description: "Wound cleaning and disinfection",
        dosageForm: "Solution",
        alertLevel: 10,
        familyId: antisepticId,
        unitId: bottleId,
        price: "6.75",
      },
    ]).returning();

    console.log("💊 Created medications:", insertedMedications.map(m => m.name));
    
    // Get medication IDs for referencing
    const amoxicillinId = insertedMedications.find(m => m.code === "MED001")!.id;
    const paracetamolId = insertedMedications.find(m => m.code === "MED002")!.id;
    const vitaminCId = insertedMedications.find(m => m.code === "MED003")!.id;
    const lisinoprilId = insertedMedications.find(m => m.code === "MED004")!.id;
    const salbutamolId = insertedMedications.find(m => m.code === "MED005")!.id;
    const omeprazoleId = insertedMedications.find(m => m.code === "MED006")!.id;
    const ibuprofenId = insertedMedications.find(m => m.code === "MED007")!.id;
    const coughSyrupId = insertedMedications.find(m => m.code === "MED008")!.id;
    const antifungalId = insertedMedications.find(m => m.code === "MED009")!.id;
    const antisepticId = insertedMedications.find(m => m.code === "MED010")!.id;
    
    console.log("📦 Creating stock records...");
    
    // Create stock records for all medications
    await db.insert(stock).values([
      { medicationId: amoxicillinId, currentQuantity: 150, reservedQuantity: 0 },
      { medicationId: paracetamolId, currentQuantity: 300, reservedQuantity: 5 },
      { medicationId: vitaminCId, currentQuantity: 200, reservedQuantity: 0 },
      { medicationId: lisinoprilId, currentQuantity: 80, reservedQuantity: 2 },
      { medicationId: salbutamolId, currentQuantity: 25, reservedQuantity: 0 },
      { medicationId: omeprazoleId, currentQuantity: 120, reservedQuantity: 3 },
      { medicationId: ibuprofenId, currentQuantity: 250, reservedQuantity: 10 },
      { medicationId: coughSyrupId, currentQuantity: 45, reservedQuantity: 0 },
      { medicationId: antifungalId, currentQuantity: 30, reservedQuantity: 1 },
      { medicationId: antisepticId, currentQuantity: 35, reservedQuantity: 0 },
    ]);
    
    console.log("✅ Stock records created successfully!");

    console.log("🛒 Creating sample purchases...");
    
    // Insert purchases
    const insertedPurchases = await db.insert(purchases).values([
      {
        supplierId: pharmaCorpId,
        totalAmount: "1250.00",
        purchaseDate: new Date("2025-01-01"),
        status: "Pending",
      },
      {
        supplierId: mediSupplyId,
        totalAmount: "850.75",
        purchaseDate: new Date("2025-01-15"),
        status: "Pending",
      },
    ]).returning();

    const purchase1Id = insertedPurchases[0].id;
    const purchase2Id = insertedPurchases[1].id;

    // Insert purchase items
    await db.insert(purchaseItems).values([
      {
        purchaseId: purchase1Id,
        medicationId: amoxicillinId,
        quantity: 100,
        unitPrice: "0.45",
        expiryDate: new Date("2026-01-01"),
      },
      {
        purchaseId: purchase1Id,
        medicationId: paracetamolId,
        quantity: 200,
        unitPrice: "0.20",
        expiryDate: new Date("2026-06-01"),
      },
      {
        purchaseId: purchase2Id,
        medicationId: vitaminCId,
        quantity: 150,
        unitPrice: "0.65",
        expiryDate: new Date("2026-12-01"),
      },
      {
        purchaseId: purchase2Id,
        medicationId: ibuprofenId,
        quantity: 200,
        unitPrice: "0.25",
        expiryDate: new Date("2026-08-01"),
      },
    ]);
    
    console.log("✅ Purchase records created successfully!");

    console.log("💰 Creating sample sales...");
    
    // Insert sales
    const insertedSales = await db.insert(sales).values([
      {
        userId: cashier1Id,
        totalAmount: "25.50",
        taxAmount: "1.50",
        discountAmount: "0.00",
        saleDate: new Date("2025-01-20"),
      },
      {
        userId: cashier2Id,
        totalAmount: "42.75",
        taxAmount: "2.75",
        discountAmount: "5.00",
        saleDate: new Date("2025-01-21"),
      },
    ]).returning();

    const sale1Id = insertedSales[0].id;
    const sale2Id = insertedSales[1].id;

    // Insert sale items
    await db.insert(saleItems).values([
      {
        saleId: sale1Id,
        medicationId: paracetamolId,
        quantity: 20,
        unitPrice: "0.25",
      },
      {
        saleId: sale1Id,
        medicationId: vitaminCId,
        quantity: 30,
        unitPrice: "0.75",
      },
      {
        saleId: sale2Id,
        medicationId: amoxicillinId,
        quantity: 15,
        unitPrice: "0.50",
      },
      {
        saleId: sale2Id,
        medicationId: ibuprofenId,
        quantity: 50,
        unitPrice: "0.30",
      },
      {
        saleId: sale2Id,
        medicationId: coughSyrupId,
        quantity: 3,
        unitPrice: "8.50",
      },
    ]);
    
    console.log("✅ Sales records created successfully!");

    console.log("📋 Creating inventory records...");
    
    // Insert inventories
    const insertedInventories = await db.insert(inventories).values([
      {
        userId: managerId,
        status: "completed",
        inventoryDate: new Date("2025-01-25"),
      },
    ]).returning();

    const inventoryId = insertedInventories[0].id;

    // Insert inventory items
    await db.insert(inventoryItems).values([
      {
        inventoryId,
        medicationId: amoxicillinId,
        expectedQuantity: 150,
        countedQuantity: 148,
        difference: -2,
      },
      {
        inventoryId,
        medicationId: paracetamolId,
        expectedQuantity: 300,
        countedQuantity: 295,
        difference: -5,
      },
      {
        inventoryId,
        medicationId: ibuprofenId,
        expectedQuantity: 250,
        countedQuantity: 250,
        difference: 0,
      },
      {
        inventoryId,
        medicationId: vitaminCId,
        expectedQuantity: 200,
        countedQuantity: 202,
        difference: 2,
      },
    ]);
    
    console.log("✅ Inventory records created successfully!");

    console.log("📉 Creating loss records...");
    
    // Insert losses
    await db.insert(losses).values([
      {
        medicationId: amoxicillinId,
        userId: managerId,
        quantity: 2,
        reason: "expired",
        value: "1.00",
        lossDate: new Date("2025-01-25"),
      },
      {
        medicationId: paracetamolId,
        userId: adminId,
        quantity: 5,
        reason: "damaged",
        value: "1.25",
        lossDate: new Date("2025-01-26"),
      },
      {
        medicationId: coughSyrupId,
        userId: managerId,
        quantity: 1,
        reason: "expired",
        value: "8.50",
        lossDate: new Date("2025-01-27"),
      },
    ]);
    
    console.log("✅ Loss records created successfully!");
    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   👥 Users: ${insertedUsers.length}`);
    console.log(`   🏥 Families: ${insertedFamilies.length}`);
    console.log(`   📏 Units: ${insertedUnits.length}`);
    console.log(`   🏭 Suppliers: ${insertedSuppliers.length}`);
    console.log(`   💊 Medications: ${insertedMedications.length}`);
    console.log(`   🛒 Purchases: ${insertedPurchases.length}`);
    console.log(`   💰 Sales: ${insertedSales.length}`);
    console.log(`   📋 Inventories: ${insertedInventories.length}`);
    console.log("\n🚀 Ready to start using the pharmacy management system!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit(0); // Exit the process
  }
}

seed();
#!/bin/bash

# Setup script for migrating to the new stock system
# This script will run all necessary migrations and setup

echo "🚀 Setting up the new stock system for Pharmacy Management..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if database is accessible
echo "📊 Checking database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database. Please check your DATABASE_URL"
    echo "Current DATABASE_URL: $DATABASE_URL"
    exit 1
fi

echo "✅ Database connection successful"

# Run the drizzle migration
echo "🔄 Running database migrations..."
npx drizzle-kit push

if [ $? -ne 0 ]; then
    echo "❌ Error: Migration failed"
    exit 1
fi

echo "✅ Migration completed successfully"

# Run the stock data migration script
echo "📦 Setting up stock records and functions..."
psql "$DATABASE_URL" -f scripts/003-migrate-stock-data.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Stock setup failed"
    exit 1
fi

echo "✅ Stock system setup completed"

# Check if stock records were created
echo "🔍 Verifying stock records..."
STOCK_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM stock;")
MEDICATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM medications;")

echo "📊 Found $MEDICATION_COUNT medications and $STOCK_COUNT stock records"

if [ "$STOCK_COUNT" -eq "$MEDICATION_COUNT" ]; then
    echo "✅ Stock records successfully created for all medications"
else
    echo "⚠️  Warning: Stock record count doesn't match medication count"
    echo "This might be expected if some medications were created before the stock system"
fi

# Install any missing dependencies
echo "📦 Checking dependencies..."
npm install

echo ""
echo "🎉 Stock system setup completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "  • Added 'stock' table to track inventory quantities"
echo "  • Removed 'stock_quantity' column from medications table"
echo "  • Created database triggers for automatic stock record creation"
echo "  • Added stock management functions"
echo "  • Updated API endpoints to use new stock system"
echo ""
echo "🚀 You can now:"
echo "  • Create medications - stock records are automatically initialized with 0 quantity"
echo "  • Purchase items - stock quantities increase automatically"
echo "  • Process sales - stock quantities decrease with validation"
echo "  • Manage stock adjustments through the stock API"
echo ""
echo "⚠️  Important notes:"
echo "  • Existing medication stock quantities have been preserved"
echo "  • Stock operations now go through dedicated stock table"
echo "  • All stock changes are logged with timestamps"
echo "  • Frontend components will need to use the updated API structure"
echo ""
echo "✨ Happy inventory management!"
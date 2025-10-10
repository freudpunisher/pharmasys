#!/bin/bash

# Script to run seed using Bun
echo "🚀 Running pharmacy management seed with Bun..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun found: $(bun --version)"

# Check if database is accessible
echo "📊 Checking database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database. Please check your DATABASE_URL"
    echo "Current DATABASE_URL: $DATABASE_URL"
    exit 1
fi

echo "✅ Database connection successful"

# Make sure the stock system is set up first
echo "🔄 Setting up stock system (if not already done)..."
if [ -f "scripts/setup-stock-system.sh" ]; then
    ./scripts/setup-stock-system.sh
else
    echo "⚠️  Stock system setup script not found. Running migrations manually..."
    npx drizzle-kit push
    if [ -f "scripts/003-migrate-stock-data.sql" ]; then
        psql "$DATABASE_URL" -f scripts/003-migrate-stock-data.sql
    fi
fi

echo ""
echo "🌱 Starting database seeding with Bun..."
echo ""

# Run the seed script with Bun
bun lib/seed.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Seeding completed successfully!"
    echo ""
    echo "📋 You can now:"
    echo "   • Start the development server: npm run dev"
    echo "   • Login with any of these users:"
    echo "     - admin@pharmacy.com (password: password123)"
    echo "     - manager@pharmacy.com (password: password123)"  
    echo "     - cashier1@pharmacy.com (password: password123)"
    echo "     - cashier2@pharmacy.com (password: password123)"
    echo ""
    echo "🏥 Your pharmacy management system is ready to use!"
else
    echo "❌ Seeding failed. Please check the error messages above."
    exit 1
fi
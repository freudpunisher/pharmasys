# Purchase & Stock Management Features

## Overview

This document outlines the comprehensive purchase and stock management features implemented in the pharmacy management system, including currency conversion to FBu, status confirmation workflows, filtering, pagination, and detailed stock reporting.

## 🛒 Purchase Management Features

### Currency Update
- **FBu Currency**: All monetary values now display in **FBu (Burundian Franc)** instead of USD
- **Purchase Values**: Updated in purchase forms, tables, and summary views
- **Consistent Display**: All monetary calculations and displays use FBu formatting

### Purchase Status Workflow
- **Initial Status**: All new purchases start with `"Pending"` status
- **Status Options**: 
  - `Pending` - Initial state, allows editing
  - `Confirmed` - Purchase approved, stock is updated, no further editing
  - `Cancelled` - Purchase cancelled, stock adjustments reversed if previously confirmed

### Purchase Confirmation System
- **Confirm Button**: Available only for purchases with `Pending` status
- **Stock Integration**: Stock quantities only increase when purchase status changes to `Confirmed`
- **Confirmation Workflow**:
  1. Purchase created with `Pending` status
  2. Admin/Manager clicks "Confirm" button
  3. Purchase status changes to `Confirmed`
  4. Stock quantities automatically updated for all purchased items
  5. Purchase becomes read-only (no editing allowed)

### Advanced Filtering System
- **Date Range Filter**: Filter purchases by start and end dates
- **Supplier Filter**: Filter by specific supplier or view all suppliers
- **Status Filter**: Filter by purchase status (All, Pending, Confirmed, Cancelled)
- **Real-time Updates**: Filters apply automatically and update results instantly

### Pagination System
- **Configurable Page Size**: 5, 10, 25, or 50 items per page
- **Navigation Controls**: Previous/Next buttons with page indicators
- **Result Count**: Shows current page info and total item count
- **Performance**: Server-side pagination for efficient data loading

### Purchase Table Features
- **Status Badges**: Color-coded status indicators
  - Yellow: Pending
  - Green: Confirmed  
  - Red: Cancelled
- **Action Buttons**:
  - **Confirm**: Green button for pending purchases
  - **Cancel**: Red button for pending purchases
  - **View**: Details view (placeholder for future implementation)
- **Disabled State**: Buttons show loading spinner during status updates

## 📦 Stock Management Features

### New Stock Module
- **Dedicated Menu**: Added "Stock" to main navigation sidebar
- **Comprehensive View**: Complete stock overview with filtering and reporting
- **Real-time Data**: Live stock levels with last update timestamps

### Stock Table Features
- **Detailed Information**:
  - Medication code and name
  - Family and unit information
  - Current quantity, reserved quantity, available quantity
  - Alert levels and status indicators
  - Unit price and total value calculations
  - Last updated timestamps

### Advanced Filtering & Search
- **Search Functionality**: Search by medication name or code
- **Family Filter**: Filter by medication families
- **Stock Level Filter**: 
  - All Items
  - Low Stock (below alert level)
  - Out of Stock (zero quantity)
- **Items per Page**: 10, 25, 50, or 100 items per page

### Stock Status System
- **Status Indicators**:
  - 🟢 **In Stock**: Above alert level
  - 🟡 **Low Stock**: At or below alert level but > 0
  - 🔴 **Out of Stock**: Zero quantity
- **Color-coded Badges**: Visual status representation

### Reporting & Export Features
- **Print Report**: A4 formatted printable stock reports
- **CSV Export**: Download stock data in CSV format
- **Report Includes**:
  - Company header with generation date
  - Summary statistics (total items, value, alerts)
  - Complete stock table with all fields
  - Professional formatting for print/digital use

### Stock Statistics Dashboard
- **Total Items**: Count of unique medications
- **Total Value**: Combined value of all stock (in FBu)
- **Low Stock Count**: Items requiring restocking
- **Out of Stock Count**: Items urgently needing attention

## 🔄 Stock Integration with Purchases

### Automated Stock Updates
- **Purchase Creation**: Stock NOT updated initially (remains at current levels)
- **Purchase Confirmation**: Stock quantities automatically increased when purchase confirmed
- **Purchase Cancellation**: If confirmed purchase is cancelled, stock quantities reversed

### Stock Movement Tracking
- **Last Updated**: Timestamp tracking for all stock changes
- **Reserved Quantities**: Support for pending order reservations
- **Available Calculations**: Current quantity minus reserved quantity

## 🎨 User Interface Improvements

### Enhanced Purchase Module
- **Responsive Design**: Mobile-friendly layout with collapsible filters
- **Loading States**: Proper loading indicators during operations
- **Error Handling**: Comprehensive error messages and user feedback
- **Action Feedback**: Toast notifications for all operations

### Stock Module Interface
- **Professional Layout**: Clean, organized information display
- **Interactive Elements**: Hover effects and clickable elements
- **Data Visualization**: Color-coded status and progress indicators
- **Export Controls**: Easy access to print and export functions

### Print-Optimized Reports
- **A4 Format**: Properly sized for standard printing
- **Professional Header**: Company branding and report metadata
- **Summary Statistics**: Key metrics prominently displayed
- **Readable Tables**: Optimized fonts and spacing for print
- **Print-specific CSS**: Hide interactive elements in print view

## 🛡️ Security & Validation

### Purchase Validation
- **Status Validation**: Only valid status transitions allowed
- **Permission Checks**: Confirmed purchases cannot be edited
- **Data Integrity**: All monetary calculations validated
- **Stock Consistency**: Stock updates only occur on confirmation

### Error Handling
- **Database Transactions**: Atomic operations for stock updates
- **Rollback Support**: Failed operations don't leave inconsistent state
- **User Feedback**: Clear error messages for all failure scenarios
- **Logging**: Comprehensive logging for debugging and audit trails

## 📋 Usage Instructions

### Creating a Purchase
1. Navigate to Purchase module
2. Click "Add Purchase"
3. Select supplier and date
4. Add medications with quantities and prices (in FBu)
5. Save purchase (status: Pending)

### Confirming a Purchase
1. In Purchase module, find pending purchase
2. Click green "Confirm" button
3. Purchase status changes to "Confirmed"
4. Stock quantities automatically updated
5. Purchase becomes read-only

### Viewing Stock Levels
1. Navigate to Stock module from sidebar
2. Use filters to find specific items
3. View current quantities and status
4. Export data or print reports as needed

### Filtering Purchases
1. Use date range filters for specific periods
2. Select specific suppliers from dropdown
3. Filter by status (Pending, Confirmed, Cancelled)
4. Adjust items per page for better viewing

## 🚀 Technical Implementation

### Database Changes
- **Stock Table**: Separate table for inventory tracking
- **Purchase Status**: Updated workflow with confirmation system
- **Relationships**: Proper foreign key relationships maintained
- **Transactions**: Database transactions for data consistency

### API Enhancements
- **Pagination Support**: Server-side pagination for performance
- **Filtering Endpoints**: Advanced query support
- **Status Updates**: Dedicated endpoint for purchase confirmation
- **Stock Operations**: Automated stock updates via triggers

### Frontend Updates
- **React Components**: Modular, reusable components
- **State Management**: Proper state handling for real-time updates
- **Error Boundaries**: Graceful error handling and recovery
- **Loading States**: User feedback during async operations

## 🔧 Configuration

### Environment Setup
- **Currency**: FBu configured as default currency
- **Pagination**: Default page sizes configured
- **Print Settings**: A4 format optimized for local printing
- **Date Formats**: Localized date formatting

### Customization Options
- **Alert Levels**: Configurable per medication
- **Status Workflow**: Extendable status system
- **Report Formats**: Customizable export templates
- **UI Themes**: Consistent with existing design system

---

## Summary

The implemented features provide a comprehensive purchase and stock management system with:

✅ **FBu Currency Integration**  
✅ **Purchase Confirmation Workflow**  
✅ **Advanced Filtering & Pagination**  
✅ **Dedicated Stock Management Module**  
✅ **Professional Reporting & Export**  
✅ **Real-time Stock Updates**  
✅ **Mobile-Responsive Design**  
✅ **Comprehensive Error Handling**  

The system now provides complete purchase-to-stock workflow management with professional reporting capabilities, making it suitable for production pharmacy operations.
# CTV Module - Lead Management

## Files Created

### 1. Mock Data
**File**: `src/mocks/data.ts` (updated)
- Added `Lead` interface
- Added `mockLeads` array (5 sample leads)

### 2. CTV Dashboard
**File**: `src/app/(dashboard)/ctv/page.tsx`
- KPI Cards: Total Leads, Converted, Contacted, New
- Recent Leads Table (5 most recent)
- Quick Actions: Create Lead, View All Leads

### 3. New Lead Page
**File**: `src/app/(dashboard)/ctv/new-lead/page.tsx`
- Form with validation (storeName, contactPerson, phone, area, type, notes)
- Phone number validation (10-11 digits)
- Submit: console.log + alert + reset

### 4. My Leads Page
**File**: `src/app/(dashboard)/ctv/my-leads/page.tsx`
- Full leads table
- Dual filters: Status (new/contacted/converted) + Area
- Stats by status
- Contact info with icons

## Design
- CORE APP style (slate colors, minimal)
- Status badges: Blue (new), Yellow (contacted), Green (converted)
- Responsive tables with overflow-x-auto

## Next Steps
- API integration
- Lead status updates
- Lead assignment to Sales when converted

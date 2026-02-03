# Hoof Admin Dashboard - Implementation Guide

## Overview
Complete Hoof Admin Dashboard with church-wide statistics, congregation management, and comprehensive export functionality.

---

## Features Implemented

### ✅ Dashboard Overview
- **Stats Cards** showing:
  - Total registered congregations
  - Total souls (church-wide)
  - Compliant congregations count
- **Congregations Table** with:
  - Gemeente naam
  - Predikant naam & contact
  - Skriba naam & contact
  - Latest membership statistics
  - Compliance status
  - Last data update timestamp

### ✅ Almanak Data Export
- **CSV Export** with one row per congregation
- **Columns include:**
  - Gemeente details (naam, ring, stigtingsdatum, erediens tye)
  - Predikant info (naam, sel, epos)
  - Skriba info (naam, sel, epos)
  - Latest statistics (totale lidmate, belydende, doop, jaar)

### ✅ Compliance Inventory Export
- **CSV Export** of non-compliant items
- **Shows:**
  - Gemeente naam
  - Item naam & category
  - Date ranges
  - Format
  - Issue type
  - Compliance notes

---

## Database Schema

### New Tables/Views

#### `hoof_admin_gemeente_summary` (VIEW)
Comprehensive view joining:
- `gemeentes` - Congregation details
- `congregation_statistics` - Latest stats
- `profiles` - Predikant & Skriba info
- `congregation_inventory` - Compliance status

**Key Columns:**
```sql
- naam, ring, stigtingsdatum, erediens_tye
- latest_total_souls, latest_baptized, latest_confessing, latest_stats_year
- predikant_naam, predikant_sel, predikant_epos
- skriba_naam, skriba_sel, skriba_epos
- total_inventory_items, compliant_items, is_fully_compliant
- last_data_update
```

#### `non_compliant_inventory` (VIEW)
Lists all non-compliant or incomplete inventory items:
```sql
- gemeente_naam
- item_name, item_category
- date_from, date_to, format
- is_compliant, compliance_notes
- issue_type (calculated)
```

### Helper Functions

#### `update_gemeente_last_data_update()`
Trigger function that updates `last_data_update` when:
- Statistics are added/updated
- Inventory items are added/updated
- Profiles are added/updated

---

## File Structure

```
src/
├── components/
│   └── admin/
│       └── HoofAdminDashboard.tsx    # Main dashboard component

supabase/
└── migrations/
    └── create_hoof_admin_dashboard.sql
```

---

## Installation Steps

### Step 1: Run Database Migration

```bash
# In Supabase Dashboard → SQL Editor
# Run: create_hoof_admin_dashboard.sql
```

This will:
- Add new columns to `gemeentes` table
- Create `hoof_admin_gemeente_summary` view
- Create `non_compliant_inventory` view
- Add triggers for `last_data_update`

### Step 2: Verify Integration

The dashboard is automatically shown to Hoof Admin users when they view the "Overview" tab in Admin Panel.

**Conditional Rendering:**
```typescript
{activeTab === 'overview' && (
  {isHoofAdminUser ? (
    <HoofAdminDashboard />
  ) : (
    <RegularAdminOverview />
  )}
)}
```

---

## Usage

### Dashboard View

#### Stats Cards
- **Geregistreerde Gemeentes**: Total active congregations
- **Totale Sieletal (Kerk)**: Sum of all latest congregation statistics
- **Voldoende Gemeentes**: Count of fully compliant congregations

#### Congregations Table
Shows all congregations with:
- **Gemeente**: Name and ring
- **Predikant**: Name with contact info
- **Kontak**: Phone and email
- **Lidmate**: Latest total with year
- **Nakoming**: Compliance badge (green = compliant, red = not compliant)
- **Laaste Opdatering**: Last data update timestamp

### Export Functions

#### Almanak Data Export
1. Click "Laai Almanak Data Af"
2. CSV downloads with format:
```csv
Gemeente Naam,Ring,Stigtingsdatum,Erediens Tye,Predikant Naam,Predikant Sel,Predikant Epos,Skriba Naam,Skriba Sel,Skriba Epos,Totale Lidmate,Belydende Lidmate,Doop Lidmate,Statistiek Jaar
NHKA Pretoria-Oos,Pretoria,1950-01-15,"Sondae 09:00 & 18:00",Ds. Jan Smit,082 123 4567,jan@example.com,Piet Botha,083 234 5678,piet@example.com,500,350,150,2024
```

#### Compliance Inventory Export
1. Click "Laai Inventaris Verslag Af"
2. CSV downloads with all non-compliant items:
```csv
Gemeente Naam,Item Naam,Kategorie,Van Datum,Tot Datum,Formaat,Voldoen,Probleem Tipe,Notas
NHKA Pretoria-Oos,Doopregister,Registers,2010-01-01,,,Nee,Formaat nie gespesifiseer,
```

---

## API Reference

### Fetch Dashboard Data

```typescript
// Fetch gemeente summaries
const { data, error } = await supabase
  .from('hoof_admin_gemeente_summary')
  .select('*')
  .order('naam');

// Calculate stats
const totalGemeentes = data?.length || 0;
const totalSouls = data?.reduce((sum, g) => sum + (g.latest_total_souls || 0), 0) || 0;
const compliantGemeentes = data?.filter(g => g.is_fully_compliant).length || 0;
```

### Fetch Non-Compliant Items

```typescript
const { data, error } = await supabase
  .from('non_compliant_inventory')
  .select('*')
  .order('gemeente_naam');
```

---

## Security (RLS)

The views inherit RLS from underlying tables:
- ✅ Hoof Admin can view all congregations
- ✅ Regular admins can only view own congregation
- ✅ Members can only view own congregation

---

## Data Flow

### Last Data Update Tracking

```
User updates statistics
  ↓
Trigger: trigger_update_gemeente_on_statistics
  ↓
Function: update_gemeente_last_data_update()
  ↓
Updates: gemeentes.last_data_update = NOW()
  ↓
Dashboard shows: "Laaste Opdatering: 2024-01-25"
```

### Compliance Calculation

```
congregation_inventory items
  ↓
Count total items
Count compliant items (is_compliant = true)
  ↓
is_fully_compliant = (compliant_items == total_items)
  ↓
Dashboard badge: Green (Voldoen) or Red (Nie Voldoen)
```

---

## CSV Export Logic

### Almanak Export

```typescript
const headers = [
  'Gemeente Naam', 'Ring', 'Stigtingsdatum', 'Erediens Tye',
  'Predikant Naam', 'Predikant Sel', 'Predikant Epos',
  'Skriba Naam', 'Skriba Sel', 'Skriba Epos',
  'Totale Lidmate', 'Belydende Lidmate', 'Doop Lidmate', 'Statistiek Jaar'
];

const rows = gemeentes.map(g => [
  g.naam, g.ring, g.stigtingsdatum, g.erediens_tye,
  g.predikant_naam, g.predikant_sel, g.predikant_epos,
  g.skriba_naam, g.skriba_sel, g.skriba_epos,
  g.latest_total_souls, g.latest_confessing, g.latest_baptized, g.latest_stats_year
]);
```

### Compliance Export

```typescript
const headers = [
  'Gemeente Naam', 'Item Naam', 'Kategorie',
  'Van Datum', 'Tot Datum', 'Formaat',
  'Voldoen', 'Probleem Tipe', 'Notas'
];

const rows = items.map(item => [
  item.gemeente_naam, item.item_name, item.item_category,
  item.date_from, item.date_to, item.format,
  item.is_compliant ? 'Ja' : 'Nee',
  item.issue_type, item.compliance_notes
]);
```

---

## Troubleshooting

### Issue: "View hoof_admin_gemeente_summary does not exist"
**Solution:** Run the migration script.

### Issue: "No data showing in dashboard"
**Solution:** 
- Verify congregations exist in `gemeentes` table
- Check that statistics have been added
- Verify RLS policies allow access

### Issue: "Predikant/Skriba not showing"
**Solution:**
- Ensure profiles exist with correct roles
- Predikant must have `'minister'` in `app_roles`
- Skriba must have `'skriba'` in `portfolio` field

### Issue: "Last update not tracking"
**Solution:**
- Verify triggers are created
- Check that `update_gemeente_last_data_update()` function exists

---

## Next Steps

1. ✅ Run database migration
2. ✅ Build frontend (already done)
3. ✅ Test as Hoof Admin user
4. ✅ Verify exports work
5. ✅ Add test data if needed

---

**Ready to use!** 🎉

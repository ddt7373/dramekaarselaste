# Administration Dashboard - Statistics & Compliance Implementation Guide

## Overview
Complete administration dashboard with Statistics Management (Lidmaattellings) and Compliance Inventory (Argiewe) features.

---

## Features Implemented

### ✅ Feature 1: Statistics Management (Lidmaattellings)
- **Data Grid** showing historical years with baptized, confessing, and total members
- **Add Year Modal** with smart total calculation
- **Expandable Rows** for detailed movements (births, deaths, baptisms, etc.)
- **Line Chart** showing trends over years using Recharts
- **Growth Calculations** with percentage and absolute values

### ✅ Feature 2: Compliance Inventory (Argiewe)
- **Compliance Checklist** UI with standard items
- **Auto-save** on blur for seamless UX
- **Date Range Picker** for each item
- **Format Toggle** (Paper/Electronic/Both)
- **Compliance Checkbox** with progress tracking
- **Grouped by Category** (Registers, Minutes, Financial, Legal)

### ✅ Feature 3: CSV Import with Pivoting Logic
- **Inventory CSV Import** that pivots wide CSV into tall database structure
- **Column Mapping** from E-ALMANAK format to database rows
- **Period Parsing** (e.g., "2010-2020", "2015-huidig")
- **Format Parsing** (e.g., "Papier", "Elektronies", "Beide")

---

## Database Schema

### Tables Created

#### 1. `congregation_statistics`
```sql
- id (UUID)
- congregation_id (UUID) → gemeentes
- year (INTEGER) - Required, unique per congregation
- baptized_members (INTEGER) - Gedoopte (non-confessing)
- confessing_members (INTEGER) - Belydende lidmate
- total_souls (INTEGER) - Auto-calculated (GENERATED ALWAYS)
- births, deaths, baptisms, confirmations (INTEGER) - Optional
- transfers_in, transfers_out (INTEGER) - Optional
- notes (TEXT)
- created_by, created_at, updated_at
```

#### 2. `congregation_inventory`
```sql
- id (UUID)
- congregation_id (UUID) → gemeentes
- item_name (TEXT) - e.g., 'Doopregister'
- item_category (TEXT) - 'Registers', 'Minutes', 'Financial', 'Legal'
- date_from, date_to (DATE)
- format (TEXT) - 'paper', 'electronic', 'both'
- is_compliant (BOOLEAN)
- compliance_notes (TEXT)
- created_by, created_at, updated_at
```

### Views

#### `congregation_statistics_with_growth`
Automatically calculates:
- `previous_year_total` - Previous year's total
- `growth` - Absolute growth
- `growth_percentage` - Percentage growth

### Helper Functions

#### `initialize_congregation_inventory(cong_id UUID)`
Seeds standard inventory items for a new congregation.

---

## File Structure

```
src/
├── types/
│   └── congregation-admin.ts          # TypeScript types
├── components/
│   └── admin/
│       ├── StatisticsManagement.tsx   # Statistics UI
│       ├── ComplianceInventory.tsx    # Inventory UI
│       └── InventoryCSVImport.tsx     # CSV import UI

supabase/
├── migrations/
│   └── create_statistics_and_inventory_tables.sql
└── functions/
    └── import-inventory-csv/
        └── index.ts                    # CSV import logic
```

---

## Installation Steps

### Step 1: Run Database Migration

```bash
# In Supabase Dashboard → SQL Editor
# Run: create_statistics_and_inventory_tables.sql
```

Or via CLI:
```bash
supabase db push
```

### Step 2: Deploy Edge Function

```bash
cd c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste
supabase functions deploy import-inventory-csv --no-verify-jwt
```

### Step 3: Install Recharts (for charts)

```bash
npm install recharts
```

### Step 4: Build Frontend

```bash
npm run build
```

---

## Usage

### Statistics Management

#### Add Year Statistics
1. Click "Voeg Jaar By"
2. Enter year
3. Enter baptized members (Gedoopte)
4. Enter confessing members (Belydende)
5. **Total Souls** calculates automatically
6. Optionally expand "Detailed Movements" section
7. Click "Stoor"

#### View Trends
- Line chart shows trends over years
- Click chevron to expand row for detailed movements
- Growth indicators show increase/decrease

### Compliance Inventory

#### Update Item
1. Check compliance checkbox if item complies
2. Select date range (From - To)
3. Choose format (Paper/Electronic/Both)
4. Add notes if needed
5. Changes auto-save on blur

#### Track Progress
- Progress bar shows overall compliance percentage
- Items grouped by category
- Color-coded badges for format and category

### CSV Import

#### Inventory Import
1. Click "Import CSV" button
2. Download template to see format
3. Prepare CSV with columns:
   - `Gemeentelys` - Congregation name
   - `[Item] Tydperk` - Period (e.g., "2010-2020")
   - `[Item] Formaat` - Format (e.g., "Papier")
4. Upload CSV
5. System pivots wide CSV into tall database structure

#### CSV Format Example
```csv
Gemeentelys,Doopregister Tydperk,Doopregister Formaat,Lidmaatregister Tydperk,Lidmaatregister Formaat
NHKA Pretoria-Oos,2010-2020,Papier,2015-huidig,Elektronies
```

This creates 2 inventory items:
1. Doopregister: 2010-2020, Paper
2. Lidmaatregister: 2015-present, Electronic

---

## Integration into Admin Panel

### Add Tabs

```typescript
// In AdminPanel.tsx

import StatisticsManagement from '@/components/admin/StatisticsManagement';
import ComplianceInventory from '@/components/admin/ComplianceInventory';
import InventoryCSVImport from '@/components/admin/InventoryCSVImport';

// Add to activeTab type
const [activeTab, setActiveTab] = useState<'... | statistics | inventory'>('overview');
const [showInventoryImport, setShowInventoryImport] = useState(false);

// Add tabs
const tabs = [
  // ... existing tabs
  { id: 'statistics', label: 'Lidmaattellings', icon: <BarChart3 /> },
  { id: 'inventory', label: 'Argiewe', icon: <FileText /> }
];

// Add tab content
{activeTab === 'statistics' && (
  <StatisticsManagement congregationId={currentGemeente?.id || ''} />
)}

{activeTab === 'inventory' && (
  <div className="space-y-4">
    <div className="flex justify-end">
      <Button onClick={() => setShowInventoryImport(true)}>
        <Upload className="w-4 h-4 mr-2" />
        Import CSV
      </Button>
    </div>
    
    <ComplianceInventory congregationId={currentGemeente?.id || ''} />
    
    {showInventoryImport && (
      <InventoryCSVImport
        onClose={() => setShowInventoryImport(false)}
        onComplete={() => {
          setShowInventoryImport(false);
          // Refresh inventory
        }}
      />
    )}
  </div>
)}
```

---

## API Reference

### Statistics

#### Fetch Statistics
```typescript
const { data, error } = await supabase
  .from('congregation_statistics_with_growth')
  .select('*')
  .eq('congregation_id', congregationId)
  .order('year', { ascending: false });
```

#### Add Statistics
```typescript
const { error } = await supabase
  .from('congregation_statistics')
  .insert([{
    congregation_id: congregationId,
    year: 2024,
    baptized_members: 150,
    confessing_members: 350,
    // total_souls calculated automatically
  }]);
```

### Inventory

#### Fetch Inventory
```typescript
const { data, error } = await supabase
  .from('congregation_inventory')
  .select('*')
  .eq('congregation_id', congregationId)
  .order('item_category');
```

#### Update Item
```typescript
const { error } = await supabase
  .from('congregation_inventory')
  .update({
    date_from: '2010-01-01',
    date_to: '2020-12-31',
    format: 'paper',
    is_compliant: true
  })
  .eq('id', itemId);
```

#### Initialize Inventory
```typescript
const { error } = await supabase.rpc('initialize_congregation_inventory', {
  cong_id: congregationId
});
```

---

## Standard Inventory Items

The following items are automatically created for each congregation:

### Registers
- Doopregister
- Lidmaatregister
- Belydenisregister
- Huweliksregister
- Begrafnisregister

### Minutes
- Kerkraadnotules
- Diakensnotules

### Financial
- Finansiële State
- Bateregister
- Bankstate
- Belastingdokumente

### Legal
- Versekeringspolis
- Grondtitel
- Boutekeninge
- Kontrakte

---

## Security (RLS)

### Statistics
- ✅ Users can view own congregation statistics
- ✅ Admins/Ministers can manage congregation statistics

### Inventory
- ✅ Users can view own congregation inventory
- ✅ Admins/Ministers can manage congregation inventory

---

## Testing

### Test Statistics
1. Add statistics for multiple years
2. Verify total_souls auto-calculates
3. Check growth calculations
4. Expand row to see detailed movements
5. View chart trends

### Test Inventory
1. Check compliance checkbox
2. Select date range
3. Choose format
4. Verify auto-save works
5. Check progress percentage updates

### Test CSV Import
1. Download template
2. Fill with test data
3. Upload CSV
4. Verify items created/updated
5. Check pivoting logic worked

---

## Troubleshooting

### Issue: "Function initialize_congregation_inventory does not exist"
**Solution:** Run the migration script again.

### Issue: "Chart not rendering"
**Solution:** Install recharts: `npm install recharts`

### Issue: "CSV import fails"
**Solution:** 
- Check CSV format matches template
- Verify congregation names exist in database
- Check Edge Function is deployed

### Issue: "Auto-save not working"
**Solution:** Check browser console for errors, verify RLS policies.

---

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy edge function
3. ✅ Install recharts
4. ✅ Build frontend
5. ✅ Integrate into Admin Panel
6. ✅ Test all features

---

**Ready to use!** 🎉

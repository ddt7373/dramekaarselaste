# Congregation Onboarding & CSV Import Features

## Overview
Two new features have been implemented to streamline congregation management:

1. **CSV Bulk Import Utility** - Import/update multiple congregations from a CSV file
2. **Congregation Onboarding Flow** - Already exists with dropdown selection

---

## Feature 1: CSV Bulk Import Utility

### Location
`src/components/nhka/GemeenteCSVImport.tsx`

### Functionality
- **Upload CSV files** to bulk import or update congregation data
- **Upsert Strategy**: 
  - If congregation name exists → UPDATE the record
  - If congregation name doesn't exist → INSERT new record
- **Template Download**: Provides a CSV template with correct headers
- **Error Handling**: Shows detailed success/failure reports

### CSV Column Mapping
The following CSV headers map to database columns:

| CSV Header | Database Column |
|------------|----------------|
| Gemeentelys | naam |
| Beskrywing | beskrywing |
| Straatadres | adres |
| Gemeente Kerkkantoor Landlyn | telefoon |
| Hoof epos | epos |
| Webwerf | webwerf |

### How to Use
1. Navigate to the Admin Dashboard
2. Click "Import CSV" button (needs to be added to UI)
3. Download the template to see required format
4. Upload your CSV file
5. Review import results

### Integration Required
To integrate this component into your admin dashboard, add:

```tsx
import GemeenteCSVImport from '@/components/nhka/GemeenteCSVImport';

// In your admin component:
const [showCSVImport, setShowCSVImport] = useState(false);

// Add button:
<Button onClick={() => setShowCSVImport(true)}>
  <Upload className="w-4 h-4 mr-2" />
  Import CSV
</Button>

// Add modal:
{showCSVImport && (
  <GemeenteCSVImport
    onClose={() => setShowCSVImport(false)}
    onComplete={() => {
      setShowCSVImport(false);
      // Refresh congregation list
    }}
  />
)}
```

---

## Feature 2: Congregation Onboarding (Already Implemented)

### Current Implementation
The `GemeenteRegister.tsx` component already has:

✅ **Dropdown Selection** - Shows all NHKA congregations from `NHKA_GEMEENTES` constant
✅ **Search Functionality** - Filter congregations by name
✅ **Auto-fill Logic** - When selecting a congregation, the form is populated
✅ **Optional Fields** - All fields except name are optional during registration
✅ **"ANDER" Option** - Allows registering new congregations not in the official list

### Current Flow
1. User clicks "Registreer Gemeente"
2. Dropdown shows all available congregations (not yet registered)
3. User can:
   - Select from the list → Name is auto-filled
   - Choose "ANDER" → Enter custom congregation name
4. Fill optional fields (description, address, phone, email, website)
5. Upload logo (optional)
6. Complete registration

### What's Missing (Future Enhancement)
The **Admin Dashboard** feature mentioned in requirements would allow:
- Viewing incomplete congregation profiles
- Highlighting empty fields
- Editing congregation details after registration

This can be added as a separate admin tab in the future.

---

## Database Schema

### Current `gemeentes` Table Structure
```typescript
interface Gemeente {
  id: string;
  naam: string;              // Required
  beskrywing?: string;       // Optional
  adres?: string;            // Optional
  telefoon?: string;         // Optional
  epos?: string;             // Optional
  webwerf?: string;          // Optional
  logo_url?: string;         // Optional
  aktief: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Files Modified/Created

### New Files
- `src/components/nhka/GemeenteCSVImport.tsx` - CSV import component

### Existing Files (No Changes Needed)
- `src/components/nhka/GemeenteRegister.tsx` - Already has dropdown + autofill
- `src/types/nhka.ts` - Gemeente interface already defined

---

## Next Steps

1. **Add CSV Import Button** to admin dashboard
2. **Test CSV Import** with sample data
3. **Create Admin Tab** (future) for viewing/editing incomplete profiles
4. **Add Field Validation** highlighting in admin view (future)

---

## Sample CSV Template

```csv
Gemeentelys,Beskrywing,Straatadres,Gemeente Kerkkantoor Landlyn,Hoof epos,Webwerf
NHKA Pretoria-Oos,Gemeente in Pretoria-Oos,Kerkstraat 123,012 345 6789,info@nhka-pta.org,https://www.nhka-pta.org
```

---

## Technical Notes

- **Upsert Logic**: Uses `naam` field to check for existing records
- **Error Handling**: Shows first 10 errors if import fails
- **Validation**: Skips rows without congregation name
- **Performance**: Processes rows sequentially (can be optimized for large files)
- **Security**: Should be restricted to admin users only

---

## Questions?

If you need any modifications or have questions about implementation, please let me know!

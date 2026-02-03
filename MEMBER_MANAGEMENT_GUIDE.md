# Member Management System - Implementation Guide

## Overview
Complete member onboarding and management system for Dramekaarselaste app where **all users are members** with assigned roles.

---

## Architecture

### Key Principle
**No separate "Staff" table** - Everyone is a member in the `profiles` table with role-based permissions.

### Role System
```typescript
type AppRole = 'member' | 'minister' | 'admin' | 'council' | 'treasurer' | 'organist';
```

**Role Hierarchy:**
- `minister` → Gets both 'minister' + 'admin' roles
- `admin` → Administrative rights
- `member` → Base role for all users
- `council`, `treasurer`, `organist` → Specific positions

---

## Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  congregation_id UUID REFERENCES gemeentes(id),
  
  -- Required (Onboarding)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cellphone TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Optional (Admin fills later)
  title TEXT,
  date_of_birth DATE,
  address_street TEXT,
  address_suburb TEXT,
  address_city TEXT,
  address_code TEXT,
  
  -- Roles & Position
  app_roles TEXT[] DEFAULT ARRAY['member'],
  portfolio TEXT,
  
  -- Media
  photo_url TEXT,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Key Features
- `user_id` can be NULL (for CSV imports before user signs up)
- `app_roles` is an array supporting multiple roles
- `portfolio` stores specific position (e.g., "Kassier", "NHSV Voorsitter")

---

## Implementation

### 1. Database Setup

**Run Migration:**
```bash
# Navigate to your project
cd c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste

# Run the migration
supabase db push
```

Or manually execute:
```sql
-- Run the SQL in: supabase/migrations/create_profiles_table.sql
```

### 2. Deploy Edge Function

```bash
# Deploy the staff import function
supabase functions deploy import-staff-csv --no-verify-jwt
```

### 3. Frontend Components

#### User Onboarding
```tsx
import UserOnboarding from '@/components/members/UserOnboarding';

// Usage
<UserOnboarding
  userId={authUserId}
  onComplete={(profile) => {
    // Handle completion
    console.log('Profile created:', profile);
  }}
/>
```

#### Member Management (Admin View)
```tsx
import MemberManagement from '@/components/members/MemberManagement';

// Usage
<MemberManagement congregationId={currentCongregationId} />
```

#### CSV Import
```tsx
import StaffCSVImport from '@/components/members/StaffCSVImport';

// Usage
<StaffCSVImport
  onClose={() => setShowImport(false)}
  onComplete={() => {
    // Refresh member list
    fetchMembers();
  }}
/>
```

---

## Feature 1: User Onboarding Flow

### User Experience
1. **Select Congregation** - Dropdown of all active congregations
2. **Enter Basic Info** - First name, last name, cellphone, email
3. **Complete** - Profile created with 'member' role

### Technical Flow
```typescript
// Step 1: Fetch congregations
const { data: congregations } = await supabase
  .from('gemeentes')
  .select('*')
  .eq('aktief', true);

// Step 2: Create profile
const { data: profile } = await supabase
  .from('profiles')
  .insert([{
    user_id: authUserId,
    congregation_id: selectedCongregationId,
    first_name: formData.first_name,
    last_name: formData.last_name,
    cellphone: formData.cellphone,
    email: formData.email,
    app_roles: ['member']
  }]);
```

---

## Feature 2: Bulk CSV Import

### CSV Format
```csv
Gemeentelys,Predikant Naam,Predikant Titel,Predikant Sel,Predikant Epos,Predikant Foto,Skriba Naam,Skriba Sel,Skriba Epos,Kassier Naam,Kassier Sel,Kassier Epos,Orrelis Naam,Orrelis Sel,Orrelis Epos,NHSV Naam,NHSV Sel,NHSV Epos
NHKA Pretoria-Oos,Johan van der Merwe,Ds.,082 123 4567,johan@nhka.org,https://example.com/photo.jpg,Maria Botha,083 234 5678,maria@nhka.org,Pieter Smit,084 345 6789,pieter@nhka.org,Anna Venter,085 456 7890,anna@nhka.org,Hannes du Toit,086 567 8901,hannes@nhka.org
```

### Role Mapping Logic

| CSV Column | Roles Assigned | Portfolio |
|------------|----------------|-----------|
| Predikant Naam | `['minister', 'admin']` | "Predikant" |
| Skriba Naam | `['admin']` | "Skriba" |
| Kassier Naam | `['member', 'treasurer']` | "Kassier" |
| Orrelis Naam | `['member', 'organist']` | "Orrelis" |
| NHSV Naam | `['member']` | "NHSV Voorsitter" |

### Import Process
1. Upload CSV file
2. Parse rows
3. For each congregation:
   - Find or create congregation
   - Extract staff members
   - Create profile for each with appropriate roles
4. Return results

### Edge Function Call
```typescript
const { data, error } = await supabase.functions.invoke('import-staff-csv', {
  body: { csvData: parsedCSVArray }
});

// Response
{
  success: 15,
  failed: 2,
  errors: ["Johan Smith: Email already exists"],
  created_profiles: [...]
}
```

---

## Feature 3: Admin Member Management

### Features
- **Search** - Filter by name, cellphone, or email
- **View** - See all members with roles and completion status
- **Edit** - Fill in missing information
- **Completion Tracking** - Visual progress bar

### Completion Percentage
Calculated based on optional fields:
- Title
- Date of Birth
- Address (Street, City, Code)

```typescript
const completion = (filledFields / totalOptionalFields) * 100;
```

### Edit Modal
Allows admin to fill in:
- Title (Dr., Ds., Mnr., Mev.)
- Date of Birth
- Full Address
- Portfolio

**Basic info is read-only** (set during onboarding).

---

## Row Level Security (RLS)

### Policies Implemented

1. **View Own Profile**
```sql
Users can view their own profile
```

2. **View Congregation Members**
```sql
Users can view all members in their congregation
```

3. **Admin Access**
```sql
Admins/Ministers can view and edit all profiles in their congregation
```

4. **Insert Own Profile**
```sql
Authenticated users can create their own profile during onboarding
```

5. **Admin Insert**
```sql
Admins can create profiles (for CSV import)
```

---

## Helper Functions

### Check Role
```typescript
import { hasRole, isAdmin } from '@/types/member-profiles';

if (hasRole(profile, 'minister')) {
  // User is a minister
}

if (isAdmin(profile)) {
  // User has admin rights (minister or admin role)
}
```

### Get Role Label
```typescript
import { getRoleLabel, getRoleBadgeColor } from '@/types/member-profiles';

const label = getRoleLabel('minister'); // "Predikant"
const color = getRoleBadgeColor('minister'); // "bg-purple-100 text-purple-800"
```

---

## Integration Steps

### 1. Add to Your App Router
```tsx
// In your main App component
import UserOnboarding from '@/components/members/UserOnboarding';
import MemberManagement from '@/components/members/MemberManagement';

// Show onboarding if user has no profile
if (!userProfile) {
  return <UserOnboarding userId={authUser.id} onComplete={handleProfileCreated} />;
}

// Show member management in admin panel
if (isAdmin(userProfile)) {
  return <MemberManagement congregationId={userProfile.congregation_id} />;
}
```

### 2. Update Navigation
Add "Members" tab to admin panel:
```tsx
{isAdmin(currentUser) && (
  <NavItem icon={Users} label="Lidmate" onClick={() => navigate('/members')} />
)}
```

### 3. Add CSV Import Button
```tsx
import StaffCSVImport from '@/components/members/StaffCSVImport';

const [showImport, setShowImport] = useState(false);

<Button onClick={() => setShowImport(true)}>
  <Upload className="w-4 h-4 mr-2" />
  Import Personeel
</Button>

{showImport && (
  <StaffCSVImport
    onClose={() => setShowImport(false)}
    onComplete={() => {
      setShowImport(false);
      fetchMembers();
    }}
  />
)}
```

---

## Testing

### 1. Test Onboarding
1. Create new auth user
2. Should see onboarding flow
3. Select congregation
4. Enter basic info
5. Verify profile created in database

### 2. Test CSV Import
1. Download template
2. Fill with sample data
3. Upload CSV
4. Verify profiles created with correct roles
5. Check role assignments

### 3. Test Admin View
1. Login as admin
2. Navigate to Members
3. Search for members
4. Edit a profile
5. Verify changes saved

---

## Files Created

### Types
- `src/types/member-profiles.ts` - Type definitions

### Components
- `src/components/members/UserOnboarding.tsx` - Onboarding flow
- `src/components/members/MemberManagement.tsx` - Admin view
- `src/components/members/StaffCSVImport.tsx` - CSV import UI

### Backend
- `supabase/functions/import-staff-csv/index.ts` - Import edge function
- `supabase/migrations/create_profiles_table.sql` - Database schema

---

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy edge function
3. ✅ Integrate components into app
4. ✅ Test onboarding flow
5. ✅ Test CSV import
6. ✅ Test admin management

---

## Questions?

If you need any modifications or have questions, let me know!

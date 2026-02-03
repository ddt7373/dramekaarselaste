# Member Management System - Quick Reference

## 🎯 What Was Built

A complete member onboarding and management system where **all users are members** with role-based permissions.

---

## 📦 Deliverables

### 1. Database Schema
**File:** `supabase/migrations/create_profiles_table.sql`
- Creates `profiles` table
- RLS policies for security
- Helper functions
- Indexes for performance

### 2. Type Definitions
**File:** `src/types/member-profiles.ts`
- `MemberProfile` interface
- `AppRole` type
- Helper functions

### 3. User Onboarding Component
**File:** `src/components/members/UserOnboarding.tsx`
- Step 1: Select congregation
- Step 2: Enter basic info (name, cellphone, email)
- Creates profile with 'member' role

### 4. CSV Import System
**Files:**
- `supabase/functions/import-staff-csv/index.ts` (Backend)
- `src/components/members/StaffCSVImport.tsx` (Frontend)

**Smart Role Mapping:**
- Predikant → `['minister', 'admin']`
- Skriba → `['admin']`
- Kassier → `['member', 'treasurer']`
- Orrelis → `['member', 'organist']`
- NHSV → `['member']`

### 5. Admin Member Management
**File:** `src/components/members/MemberManagement.tsx`
- View all members
- Search functionality
- Edit profiles
- Completion tracking
- Fill missing data

---

## 🚀 Quick Start

### Step 1: Run Database Migration
```bash
cd c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste
supabase db push
```

Or run SQL manually in Supabase Dashboard.

### Step 2: Deploy Edge Function
```bash
supabase functions deploy import-staff-csv --no-verify-jwt
```

### Step 3: Use Components

**Onboarding:**
```tsx
import UserOnboarding from '@/components/members/UserOnboarding';

<UserOnboarding
  userId={authUserId}
  onComplete={(profile) => console.log('Created:', profile)}
/>
```

**Admin View:**
```tsx
import MemberManagement from '@/components/members/MemberManagement';

<MemberManagement congregationId={congregationId} />
```

**CSV Import:**
```tsx
import StaffCSVImport from '@/components/members/StaffCSVImport';

<StaffCSVImport
  onClose={() => setShowImport(false)}
  onComplete={() => fetchMembers()}
/>
```

---

## 📋 CSV Template

```csv
Gemeentelys,Predikant Naam,Predikant Titel,Predikant Sel,Predikant Epos,Predikant Foto,Skriba Naam,Skriba Sel,Skriba Epos,Kassier Naam,Kassier Sel,Kassier Epos,Orrelis Naam,Orrelis Sel,Orrelis Epos,NHSV Naam,NHSV Sel,NHSV Epos
NHKA Pretoria-Oos,Johan van der Merwe,Ds.,082 123 4567,johan@nhka.org,https://example.com/photo.jpg,Maria Botha,083 234 5678,maria@nhka.org,Pieter Smit,084 345 6789,pieter@nhka.org,Anna Venter,085 456 7890,anna@nhka.org,Hannes du Toit,086 567 8901,hannes@nhka.org
```

---

## 🔑 Key Features

### Onboarding
✅ Minimal friction - only 4 required fields
✅ Congregation selection from dropdown
✅ Automatic 'member' role assignment

### CSV Import
✅ Bulk import from GEMEENTE-INLIGTING.csv
✅ Smart role mapping based on position
✅ Upsert logic (update if exists, insert if new)
✅ Detailed error reporting

### Admin Management
✅ Search by name, phone, email
✅ View all members with roles
✅ Edit profiles to fill missing data
✅ Completion percentage tracking
✅ Role badges for visual identification

---

## 🎨 Role System

| Role | Badge Color | Description |
|------|-------------|-------------|
| member | Gray | Base role for all users |
| minister | Purple | Predikant (gets admin rights) |
| admin | Blue | Administrative access |
| council | Green | Kerkraad member |
| treasurer | Yellow | Kassier |
| organist | Pink | Orrelis |

---

## 🔒 Security (RLS)

- ✅ Users can view own profile
- ✅ Users can view congregation members
- ✅ Admins can view/edit all in congregation
- ✅ Users can update own profile
- ✅ Admins can update any profile
- ✅ Authenticated users can create own profile
- ✅ Admins can create profiles (CSV import)

---

## 📊 Database Structure

```
profiles
├── id (UUID)
├── user_id (UUID) - Can be NULL
├── congregation_id (UUID) - Required
├── first_name (TEXT) - Required
├── last_name (TEXT) - Required
├── cellphone (TEXT) - Required
├── email (TEXT) - Required
├── title (TEXT) - Optional
├── date_of_birth (DATE) - Optional
├── address_* (TEXT) - Optional
├── app_roles (TEXT[]) - Default ['member']
├── portfolio (TEXT) - Optional
├── photo_url (TEXT) - Optional
└── active (BOOLEAN) - Default true
```

---

## ✅ Checklist

- [ ] Run database migration
- [ ] Deploy edge function
- [ ] Test onboarding flow
- [ ] Test CSV import
- [ ] Test admin management
- [ ] Integrate into main app
- [ ] Add navigation items
- [ ] Test RLS policies

---

## 📚 Documentation

Full guide: `MEMBER_MANAGEMENT_GUIDE.md`

---

## 🆘 Support

If you encounter issues:
1. Check database migration ran successfully
2. Verify edge function deployed
3. Check browser console for errors
4. Verify RLS policies are active

---

**Ready to use!** 🎉

# Updated Profiles Table - Field Reference

## Name Fields (Detailed Afrikaans Structure)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `voorletters` | TEXT | No | Initials | "J.P." |
| `first_name` | TEXT | **Yes** | First/Given name | "Johannes" |
| `second_name` | TEXT | No | Second name | "Petrus" |
| `third_name` | TEXT | No | Third name | "Willem" |
| `noemnaam` | TEXT | No | Preferred name/nickname | "Johan" |
| `surname` | TEXT | **Yes** | Family name/surname | "van der Merwe" |
| `nooiensvan` | TEXT | No | Maiden name (for married women) | "Botha" |

## Contact Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `cellphone` | TEXT | **Yes** | Mobile number | "082 123 4567" |
| `email` | TEXT | **Yes** | Email address | "johan@example.com" |
| `home_phone` | TEXT | No | Home telephone | "012 345 6789" |
| `work_phone` | TEXT | No | Work telephone | "012 987 6543" |
| `alternative_email` | TEXT | No | Secondary email | "johan.work@example.com" |

## Personal Info

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | TEXT | No | Title/Honorific | "Ds.", "Dr.", "Mnr.", "Mev." |
| `gender` | TEXT | No | Gender | "man", "vrou", "ander" |
| `date_of_birth` | DATE | No | Date of birth | "1980-05-15" |
| `id_number` | TEXT | No | ID/Passport number | "8005155678089" |

## Address Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `address_street` | TEXT | No | Street address | "123 Kerkstraat" |
| `address_suburb` | TEXT | No | Suburb | "Hatfield" |
| `address_city` | TEXT | No | City/Town | "Pretoria" |
| `address_code` | TEXT | No | Postal code | "0028" |
| `address_country` | TEXT | No | Country (default: Suid-Afrika) | "Suid-Afrika" |

## Family Info

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `marital_status` | TEXT | No | Marital status | "ongetroud", "getroud", "geskei", "weduwee", "weduwenaar" |
| `spouse_name` | TEXT | No | Spouse's full name | "Maria van der Merwe" |

## Membership Info

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `membership_date` | DATE | No | Date joined congregation | "2020-01-15" |
| `baptism_date` | DATE | No | Date of baptism | "1980-06-20" |
| `confirmation_date` | DATE | No | Date of confirmation | "1995-04-10" |

## Emergency Contact

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `emergency_contact_name` | TEXT | No | Emergency contact name | "Maria Botha" |
| `emergency_contact_phone` | TEXT | No | Emergency contact phone | "083 234 5678" |
| `emergency_contact_relationship` | TEXT | No | Relationship | "Suster", "Vrou", "Seun" |

## Roles & Portfolio

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `app_roles` | TEXT[] | **Yes** | Array of roles | `{member,admin}` |
| `portfolio` | TEXT | No | Specific position | "Kassier", "NHSV Voorsitter" |

## Other

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `photo_url` | TEXT | No | Profile photo URL | "https://..." |
| `notes` | TEXT | No | Admin notes | "Aktief in jeugbediening" |

---

## Helper Functions

### SQL Functions

```sql
-- Get full name
SELECT get_full_name(profile_id);
-- Returns: "Ds. Johannes Petrus van der Merwe"

-- Get display name (uses noemnaam if available)
SELECT get_display_name(profile_id);
-- Returns: "Johan van der Merwe" (if noemnaam is "Johan")
-- Or: "Johannes van der Merwe" (if no noemnaam)
```

### TypeScript Functions

```typescript
import { getFullName, getDisplayName, getInitials } from '@/types/member-profiles';

// Get full formal name
const fullName = getFullName(profile);
// "Ds. Johannes Petrus van der Merwe"

// Get display name (preferred)
const displayName = getDisplayName(profile);
// "Johan van der Merwe"

// Get initials
const initials = getInitials(profile);
// "J.P." or "J.v."
```

---

## Onboarding vs Admin Fields

### Required During Onboarding (Minimal)
- ✅ `first_name`
- ✅ `surname`
- ✅ `cellphone`
- ✅ `email`

### Optional (Admin fills later)
- All other name fields (voorletters, second_name, etc.)
- Personal info (gender, date_of_birth, id_number)
- Full address
- Family info
- Membership dates
- Emergency contact
- Notes

---

## Example Profile

```json
{
  "voorletters": "J.P.",
  "first_name": "Johannes",
  "second_name": "Petrus",
  "third_name": null,
  "noemnaam": "Johan",
  "surname": "van der Merwe",
  "nooiensvan": null,
  
  "cellphone": "082 123 4567",
  "email": "johan@example.com",
  "home_phone": "012 345 6789",
  
  "title": "Ds.",
  "gender": "man",
  "date_of_birth": "1980-05-15",
  "id_number": "8005155678089",
  
  "address_street": "123 Kerkstraat",
  "address_suburb": "Hatfield",
  "address_city": "Pretoria",
  "address_code": "0028",
  "address_country": "Suid-Afrika",
  
  "marital_status": "getroud",
  "spouse_name": "Maria van der Merwe",
  
  "app_roles": ["minister", "admin"],
  "portfolio": "Predikant",
  
  "membership_date": "2020-01-15",
  "baptism_date": "1980-06-20",
  "confirmation_date": "1995-04-10",
  
  "emergency_contact_name": "Maria van der Merwe",
  "emergency_contact_phone": "083 234 5678",
  "emergency_contact_relationship": "Vrou"
}
```

---

## Migration Notes

If you already created the old table, you need to:

1. **Drop old table** (if no important data):
```sql
DROP TABLE IF EXISTS profiles CASCADE;
```

2. **Run new migration**:
```sql
-- Run the updated create_profiles_table.sql
```

3. **Or add columns** (if you have existing data):
```sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS voorletters TEXT,
  ADD COLUMN IF NOT EXISTS second_name TEXT,
  ADD COLUMN IF NOT EXISTS third_name TEXT,
  ADD COLUMN IF NOT EXISTS noemnaam TEXT,
  ADD COLUMN IF NOT EXISTS nooiensvan TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  -- ... add all other new columns
;

-- Rename columns
ALTER TABLE profiles RENAME COLUMN last_name TO surname;
```

---

**Updated:** 2026-01-24

# 📋 Stap-vir-Stap Instruksies: Database & Edge Function Setup

## Oorsig
Hierdie gids help jou om die database migrations te run en die edge function te deploy.

---

## ✅ STAP 1: Run Database Migrations

### **1.1: Gaan na Supabase Dashboard**

1. Open jou browser
2. Gaan na: https://supabase.com/dashboard
3. Login met jou account
4. Kies jou projek: **wskkdnzeqgdjxqozyfut**

---

### **1.2: Run Migration 1 - Statistics & Inventory Tables**

1. Klik op **"SQL Editor"** in die linker menu
2. Klik op **"New Query"** (bo regs)
3. Open hierdie lêer op jou rekenaar:
   ```
   c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste\supabase\migrations\create_statistics_and_inventory_tables.sql
   ```
4. **Kopieer** die hele inhoud (Ctrl+A, Ctrl+C)
5. **Plak** dit in die SQL Editor (Ctrl+V)
6. Klik **"Run"** (of druk Ctrl+Enter)

**Verwag Output:**
```
Success. No rows returned
```

**Verifieer:**
- Gaan na **"Table Editor"** in linker menu
- Jy moet sien:
  - ✅ `congregation_statistics` tabel
  - ✅ `congregation_inventory` tabel

---

### **1.3: Run Migration 2 - Hoof Admin Dashboard**

1. Nog steeds in **"SQL Editor"**
2. Klik **"New Query"** weer
3. Open hierdie lêer:
   ```
   c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste\supabase\migrations\create_hoof_admin_dashboard.sql
   ```
4. **Kopieer** die hele inhoud
5. **Plak** dit in die SQL Editor
6. Klik **"Run"**

**Verwag Output:**
```
Success. No rows returned
```

**Verifieer:**
- Gaan na **"Database"** → **"Views"** in linker menu
- Jy moet sien:
  - ✅ `hoof_admin_gemeente_summary`
  - ✅ `non_compliant_inventory`
  - ✅ `congregation_statistics_with_growth`

---

### **1.4: Run Migration 3 - Profiles Table (As jy dit nog nie gedoen het nie)**

1. Nog steeds in **"SQL Editor"**
2. Klik **"New Query"**
3. Open hierdie lêer:
   ```
   c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste\supabase\migrations\create_profiles_table_clean.sql
   ```
4. **Kopieer** die hele inhoud
5. **Plak** dit in die SQL Editor
6. Klik **"Run"**

**Verwag Output:**
```
Success. No rows returned
```

**Verifieer:**
- Gaan na **"Table Editor"**
- Jy moet sien:
  - ✅ `profiles` tabel met alle velde (voorletters, first_name, surname, ens.)

---

## ✅ STAP 2: Deploy Edge Functions

### **2.1: Deploy import-staff-csv Function**

1. Gaan na **"Edge Functions"** in linker menu
2. Klik **"Create a new function"** (of **"Deploy a new function"**)
3. **Function Name:** `import-staff-csv`
4. Open hierdie lêer:
   ```
   c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste\supabase\functions\import-staff-csv\index.ts
   ```
5. **Kopieer** die hele inhoud
6. **Plak** dit in die code editor
7. Klik **"Deploy function"**

**Verwag Output:**
```
✓ Function deployed successfully
```

---

### **2.2: Deploy import-inventory-csv Function**

1. Nog steeds in **"Edge Functions"**
2. Klik **"Create a new function"** weer
3. **Function Name:** `import-inventory-csv`
4. Open hierdie lêer:
   ```
   c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste\supabase\functions\import-inventory-csv\index.ts
   ```
5. **Kopieer** die hele inhoud
6. **Plak** dit in die code editor
7. Klik **"Deploy function"**

**Verwag Output:**
```
✓ Function deployed successfully
```

---

## ✅ STAP 3: Verifieer Alles Werk

### **3.1: Test Database Tables**

1. Gaan na **"Table Editor"**
2. Klik op **"congregation_statistics"**
3. Probeer 'n test ry byvoeg:
   - Click **"Insert"** → **"Insert row"**
   - Vul in:
     - `congregation_id`: (kies 'n gemeente ID)
     - `year`: 2024
     - `baptized_members`: 100
     - `confessing_members`: 200
   - Klik **"Save"**
4. Verifieer `total_souls` is outomaties bereken as **300**

---

### **3.2: Test Views**

1. Gaan na **"SQL Editor"**
2. Tik hierdie query:
   ```sql
   SELECT * FROM hoof_admin_gemeente_summary LIMIT 5;
   ```
3. Klik **"Run"**
4. Jy moet data sien (as daar gemeentes is)

---

### **3.3: Test Edge Functions**

1. Gaan na **"Edge Functions"**
2. Klik op **"import-staff-csv"**
3. Klik **"Invoke function"** (test knoppie)
4. Jy moet sien:
   ```
   Function invoked successfully
   ```

---

## ✅ STAP 4: Test Frontend Lokaal (Opsioneel)

### **4.1: Start Dev Server**

1. Open Command Prompt
2. Navigeer na projek:
   ```cmd
   cd c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste
   ```
3. Start dev server:
   ```cmd
   npm run dev
   ```
4. Gaan na: http://localhost:5173

---

### **4.2: Test as Hoof Admin**

1. Login met 'n Hoof Admin account
2. Gaan na **"Administrasie"** (Admin Panel)
3. Jy moet sien:
   - ✅ **Hoof Admin Dashboard** (nie die gewone overview nie)
   - ✅ Stats kaarte (Gemeentes, Sieletal, Voldoende)
   - ✅ Gemeentes tabel
   - ✅ 2 Export knoppies

4. Test exports:
   - Klik **"Laai Almanak Data Af"**
   - Verifieer CSV download
   - Klik **"Laai Inventaris Verslag Af"**
   - Verifieer CSV download

---

### **4.3: Test as Gemeente Admin**

1. Login met 'n Gemeente Admin account
2. Gaan na **"Administrasie"**
3. Jy moet sien:
   - ✅ Gewone overview (nie Hoof Admin Dashboard nie)
   - ✅ **"Lidmaattellings"** tab
   - ✅ **"Argiewe"** tab
   - ✅ **"Lidmate"** tab

4. Test Statistics:
   - Klik **"Lidmaattellings"** tab
   - Klik **"Voeg Jaar By"**
   - Vul in statistieke
   - Verifieer total_souls bereken outomaties

5. Test Inventory:
   - Klik **"Argiewe"** tab
   - Verifieer 15 standaard items
   - Update 'n item (date, format, compliance)
   - Verifieer auto-save werk

---

## 🎯 Troubleshooting

### **Probleem: "Table already exists"**
**Oplossing:** 
- Die tabel bestaan reeds
- Skip die migration
- Of drop die tabel eers: `DROP TABLE IF EXISTS [table_name] CASCADE;`

### **Probleem: "View already exists"**
**Oplossing:**
- Die view bestaan reeds
- Skip die migration
- Of drop die view eers: `DROP VIEW IF EXISTS [view_name] CASCADE;`

### **Probleem: "Function already exists"**
**Oplossing:**
- Gebruik `CREATE OR REPLACE FUNCTION` (reeds in die script)
- Of drop die function eers: `DROP FUNCTION IF EXISTS [function_name]() CASCADE;`

### **Probleem: "Edge function not found"**
**Oplossing:**
- Verifieer function naam is korrek
- Verifieer function is deployed
- Wag 'n paar minute vir deployment

### **Probleem: "No data in dashboard"**
**Oplossing:**
- Voeg test data by in `congregation_statistics`
- Voeg test data by in `congregation_inventory`
- Verifieer gemeentes bestaan in `gemeentes` tabel

---

## ✅ Checklist

**Database Migrations:**
- [ ] `create_statistics_and_inventory_tables.sql` gerun
- [ ] `create_hoof_admin_dashboard.sql` gerun
- [ ] `create_profiles_table_clean.sql` gerun (as nodig)
- [ ] Tabelle geverifieer in Table Editor
- [ ] Views geverifieer in Database → Views

**Edge Functions:**
- [ ] `import-staff-csv` deployed
- [ ] `import-inventory-csv` deployed
- [ ] Functions geverifieer in Edge Functions

**Testing:**
- [ ] Test data bygevoeg
- [ ] Hoof Admin Dashboard getoets
- [ ] Statistics Management getoets
- [ ] Compliance Inventory getoets
- [ ] Exports getoets

---

## 🎉 Klaar!

As alles hierbo ✅ is, is jou sisteem gereed!

**Volgende:**
- Deploy na produksie
- Voeg regte data by
- Train gebruikers

---

**Hulp Nodig?**
- Kyk na `COMPLETE_SUMMARY.md` vir oorsig
- Kyk na `HOOF_ADMIN_DASHBOARD_GUIDE.md` vir details
- Kyk na `ADMIN_DASHBOARD_GUIDE.md` vir statistics & inventory

**Geniet jou nuwe sisteem!** 🚀

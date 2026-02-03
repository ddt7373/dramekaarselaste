# Supabase Migrasie Herstel

## Probleem: "Remote migration versions not found in local migrations directory"

Die remote databasis het migrasie-weergawes wat nie meer in jou plaaslike `supabase/migrations` vouer bestaan nie (bv. weens hernoemde lêers).

## Oplossing

### Stap 1: Bepaal watter weergawes probleme veroorsaak

Gebruik die Supabase Dashboard of voer uit:

```bash
npx supabase migration list
```

### Stap 2: Herstel die migrasie-geskiedenis

Vir elke weergawe wat "not found" is, merk dit as reverted:

```bash
npx supabase migration repair --status reverted 20240126
npx supabase migration repair --status reverted 20240127
```

**Let wel:** Vervang `20240126` en `20240127` met die presiese weergawe-nommers wat in die foutboodskap genoem word. Die weergawe is gewoonlik die eerste deel van die migrasie-lêernaam (bv. `20240126_geloofsonderrig_analysis` → probeer `20240126` of die volledige naam).

### Stap 3: Druk migrasies na remote

```bash
npx supabase db push
```

### Alternatief: Trek remote skema af

As die herstel nie werk nie, kan jy die remote skema na plaaslik trek:

```bash
npx supabase db pull
```

Dit skep 'n nuwe migrasie-lêer met die huidige remote skema. Daarna kan jy `db push` weer probeer.

## Hernoemde Migrasies (2025-01-29)

Die volgende lêers is hernoem na die patroon `YYYYMMDDHHMMSS_name.sql`:

| Ou naam | Nuwe naam |
|---------|-----------|
| create_artikel_portaal_tables.sql | 20240125000001_create_artikel_portaal_tables.sql |
| create_hoof_admin_dashboard.sql | 20240125000002_create_hoof_admin_dashboard.sql |
| create_profiles_table.sql | 20240125000003_create_profiles_table.sql |
| create_profiles_table_clean.sql | 20240125000004_create_profiles_table_clean.sql |
| create_statistics_and_inventory_tables.sql | 20240125000005_create_statistics_and_inventory_tables.sql |
| fix_menu_layouts_schema.sql | 20240125000006_fix_menu_layouts_schema.sql |
| 20240126_geloofsonderrig_analysis.sql | 20240126120000_geloofsonderrig_analysis.sql |
| 20240127_fix_profiles_rls_and_test_data.sql | 20240127120000_fix_profiles_rls_and_test_data.sql |

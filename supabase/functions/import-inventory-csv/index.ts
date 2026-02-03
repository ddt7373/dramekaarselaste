import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping of CSV columns to inventory item names
const INVENTORY_COLUMN_MAPPING: Record<string, { itemName: string; category: string }> = {
    'Doopregister Tydperk': { itemName: 'Doopregister', category: 'Registers' },
    'Doopregister Formaat': { itemName: 'Doopregister', category: 'Registers' },
    'Lidmaatregister Tydperk': { itemName: 'Lidmaatregister', category: 'Registers' },
    'Lidmaatregister Formaat': { itemName: 'Lidmaatregister', category: 'Registers' },
    'Belydenisregister Tydperk': { itemName: 'Belydenisregister', category: 'Registers' },
    'Belydenisregister Formaat': { itemName: 'Belydenisregister', category: 'Registers' },
    'Huweliksregister Tydperk': { itemName: 'Huweliksregister', category: 'Registers' },
    'Huweliksregister Formaat': { itemName: 'Huweliksregister', category: 'Registers' },
    'Begrafnisregister Tydperk': { itemName: 'Begrafnisregister', category: 'Registers' },
    'Begrafnisregister Formaat': { itemName: 'Begrafnisregister', category: 'Registers' },
    'Kerkraadnotules Tydperk': { itemName: 'Kerkraadnotules', category: 'Minutes' },
    'Kerkraadnotules Formaat': { itemName: 'Kerkraadnotules', category: 'Minutes' },
    'Diakensnotules Tydperk': { itemName: 'Diakensnotules', category: 'Minutes' },
    'Diakensnotules Formaat': { itemName: 'Diakensnotules', category: 'Minutes' },
    'Finansiële State Tydperk': { itemName: 'Finansiële State', category: 'Financial' },
    'Finansiële State Formaat': { itemName: 'Finansiële State', category: 'Financial' },
    'Bateregister Tydperk': { itemName: 'Bateregister', category: 'Financial' },
    'Bateregister Formaat': { itemName: 'Bateregister', category: 'Financial' },
    'Bankstate Tydperk': { itemName: 'Bankstate', category: 'Financial' },
    'Bankstate Formaat': { itemName: 'Bankstate', category: 'Financial' },
    'Belastingdokumente Tydperk': { itemName: 'Belastingdokumente', category: 'Financial' },
    'Belastingdokumente Formaat': { itemName: 'Belastingdokumente', category: 'Financial' },
    'Versekeringspolis Tydperk': { itemName: 'Versekeringspolis', category: 'Legal' },
    'Versekeringspolis Formaat': { itemName: 'Versekeringspolis', category: 'Legal' },
    'Grondtitel Tydperk': { itemName: 'Grondtitel', category: 'Legal' },
    'Grondtitel Formaat': { itemName: 'Grondtitel', category: 'Legal' },
    'Boutekeninge Tydperk': { itemName: 'Boutekeninge', category: 'Legal' },
    'Boutekeninge Formaat': { itemName: 'Boutekeninge', category: 'Legal' },
    'Kontrakte Tydperk': { itemName: 'Kontrakte', category: 'Legal' },
    'Kontrakte Formaat': { itemName: 'Kontrakte', category: 'Legal' }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { csvData } = await req.json();

        if (!csvData || !Array.isArray(csvData)) {
            throw new Error('Invalid CSV data format');
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            created_items: [] as any[]
        };

        // Process each row (congregation)
        for (const row of csvData) {
            try {
                const congregationName = row['Gemeentelys'] || row['Gemeente'] || row['Name'];

                if (!congregationName) {
                    results.errors.push('Row skipped: No congregation name');
                    results.failed++;
                    continue;
                }

                // Find congregation
                const { data: congregation, error: congError } = await supabaseClient
                    .from('gemeentes')
                    .select('id')
                    .eq('naam', congregationName)
                    .single();

                if (congError || !congregation) {
                    results.errors.push(`${congregationName}: Congregation not found`);
                    results.failed++;
                    continue;
                }

                // Process each inventory item from the CSV
                const itemsToUpsert: any[] = [];

                for (const [csvColumn, mapping] of Object.entries(INVENTORY_COLUMN_MAPPING)) {
                    const value = row[csvColumn];

                    if (!value || value.trim() === '') continue;

                    // Check if this is a period (Tydperk) or format (Formaat) column
                    if (csvColumn.includes('Tydperk')) {
                        // Parse period (e.g., "2010-2020" or "2015-huidig")
                        const period = parsePeriod(value);

                        // Find or create item
                        let item = itemsToUpsert.find(i => i.item_name === mapping.itemName);
                        if (!item) {
                            item = {
                                congregation_id: congregation.id,
                                item_name: mapping.itemName,
                                item_category: mapping.category,
                                date_from: period.from,
                                date_to: period.to
                            };
                            itemsToUpsert.push(item);
                        } else {
                            item.date_from = period.from;
                            item.date_to = period.to;
                        }
                    } else if (csvColumn.includes('Formaat')) {
                        // Parse format (e.g., "Papier", "Elektronies", "Beide")
                        const format = parseFormat(value);

                        let item = itemsToUpsert.find(i => i.item_name === mapping.itemName);
                        if (!item) {
                            item = {
                                congregation_id: congregation.id,
                                item_name: mapping.itemName,
                                item_category: mapping.category,
                                format: format
                            };
                            itemsToUpsert.push(item);
                        } else {
                            item.format = format;
                        }
                    }
                }

                // Upsert all items for this congregation
                for (const item of itemsToUpsert) {
                    try {
                        const { data: existing } = await supabaseClient
                            .from('congregation_inventory')
                            .select('id')
                            .eq('congregation_id', congregation.id)
                            .eq('item_name', item.item_name)
                            .single();

                        if (existing) {
                            // Update
                            const { error: updateError } = await supabaseClient
                                .from('congregation_inventory')
                                .update(item)
                                .eq('id', existing.id);

                            if (updateError) throw updateError;
                        } else {
                            // Insert
                            const { error: insertError } = await supabaseClient
                                .from('congregation_inventory')
                                .insert([item]);

                            if (insertError) throw insertError;
                        }

                        results.created_items.push(item);
                        results.success++;
                    } catch (err: any) {
                        results.errors.push(`${congregationName} - ${item.item_name}: ${err.message}`);
                        results.failed++;
                    }
                }
            } catch (err: any) {
                results.errors.push(`Row error: ${err.message}`);
                results.failed++;
            }
        }

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

// Helper function to parse period strings
function parsePeriod(periodStr: string): { from: string | null; to: string | null } {
    if (!periodStr) return { from: null, to: null };

    // Handle formats like "2010-2020", "2015-huidig", "2010 - 2020"
    const cleaned = periodStr.trim().toLowerCase();

    // Check for "huidig" or "current"
    const isCurrent = cleaned.includes('huidig') || cleaned.includes('current');

    // Extract years
    const yearMatches = cleaned.match(/\d{4}/g);

    if (!yearMatches || yearMatches.length === 0) {
        return { from: null, to: null };
    }

    const fromYear = yearMatches[0];
    const toYear = isCurrent ? null : (yearMatches[1] || fromYear);

    return {
        from: `${fromYear}-01-01`,
        to: toYear ? `${toYear}-12-31` : null
    };
}

// Helper function to parse format strings
function parseFormat(formatStr: string): 'paper' | 'electronic' | 'both' | null {
    if (!formatStr) return null;

    const cleaned = formatStr.trim().toLowerCase();

    if (cleaned.includes('papier') || cleaned.includes('paper')) {
        if (cleaned.includes('elektronies') || cleaned.includes('electronic')) {
            return 'both';
        }
        return 'paper';
    }

    if (cleaned.includes('elektronies') || cleaned.includes('electronic')) {
        return 'electronic';
    }

    if (cleaned.includes('beide') || cleaned.includes('both')) {
        return 'both';
    }

    return null;
}

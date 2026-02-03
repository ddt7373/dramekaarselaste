import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVStaffMember {
    name: string;
    title?: string;
    cellphone?: string;
    email?: string;
    photo_url?: string;
    roles: string[];
    portfolio?: string;
}

interface ProcessedRow {
    congregation_name: string;
    congregation_id?: string;
    staff_members: CSVStaffMember[];
}

serve(async (req) => {
    // Handle CORS
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
            created_profiles: [] as any[]
        };

        // Process each row (congregation)
        for (const row of csvData) {
            try {
                const processedRow = await processRow(row, supabaseClient);

                if (processedRow) {
                    // Create profiles for each staff member
                    for (const staffMember of processedRow.staff_members) {
                        try {
                            const profile = await createStaffProfile(
                                staffMember,
                                processedRow.congregation_id!,
                                supabaseClient
                            );

                            results.created_profiles.push(profile);
                            results.success++;
                        } catch (err: any) {
                            results.failed++;
                            results.errors.push(`${staffMember.name}: ${err.message}`);
                        }
                    }
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Row error: ${err.message}`);
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

async function processRow(row: any, supabase: any): Promise<ProcessedRow | null> {
    const congregationName = row['Gemeentelys'] || row['Gemeente'] || row['Name'];

    if (!congregationName) {
        throw new Error('No congregation name found');
    }

    // Find or create congregation
    let { data: congregation, error } = await supabase
        .from('gemeentes')
        .select('id')
        .eq('naam', congregationName)
        .single();

    if (error || !congregation) {
        // Create congregation if it doesn't exist
        const { data: newCong, error: createError } = await supabase
            .from('gemeentes')
            .insert([{ naam: congregationName, aktief: true }])
            .select()
            .single();

        if (createError) throw createError;
        congregation = newCong;
    }

    const staffMembers: CSVStaffMember[] = [];

    // Extract Minister (Predikant)
    const ministerName = row['Predikant Naam'] || row['Minister Name'];
    if (ministerName && ministerName.trim()) {
        staffMembers.push({
            name: ministerName.trim(),
            title: row['Predikant Titel'] || row['Minister Title'] || 'Ds.',
            cellphone: row['Predikant Sel'] || row['Minister Cell'],
            email: row['Predikant Epos'] || row['Minister Email'],
            photo_url: row['Predikant Foto'] || row['Minister Photo'],
            roles: ['minister', 'admin'], // Ministers get admin rights
            portfolio: 'Predikant'
        });
    }

    // Extract Scribe (Skriba)
    const scribeName = row['Skriba Naam'] || row['Scribe Name'];
    if (scribeName && scribeName.trim()) {
        staffMembers.push({
            name: scribeName.trim(),
            cellphone: row['Skriba Sel'] || row['Scribe Cell'],
            email: row['Skriba Epos'] || row['Scribe Email'],
            roles: ['admin'], // Scribes get admin rights
            portfolio: 'Skriba'
        });
    }

    // Extract Treasurer (Kassier)
    const treasurerName = row['Kassier Naam'] || row['Treasurer Name'];
    if (treasurerName && treasurerName.trim()) {
        staffMembers.push({
            name: treasurerName.trim(),
            cellphone: row['Kassier Sel'] || row['Treasurer Cell'],
            email: row['Kassier Epos'] || row['Treasurer Email'],
            roles: ['member', 'treasurer'],
            portfolio: 'Kassier'
        });
    }

    // Extract Organist (Orrelis)
    const organistName = row['Orrelis Naam'] || row['Organist Name'];
    if (organistName && organistName.trim()) {
        staffMembers.push({
            name: organistName.trim(),
            cellphone: row['Orrelis Sel'] || row['Organist Cell'],
            email: row['Orrelis Epos'] || row['Organist Email'],
            roles: ['member', 'organist'],
            portfolio: 'Orrelis'
        });
    }

    // Extract NHSV
    const nhsvName = row['NHSV Naam'] || row['NHSV Name'];
    if (nhsvName && nhsvName.trim()) {
        staffMembers.push({
            name: nhsvName.trim(),
            cellphone: row['NHSV Sel'] || row['NHSV Cell'],
            email: row['NHSV Epos'] || row['NHSV Email'],
            roles: ['member'],
            portfolio: 'NHSV Voorsitter'
        });
    }

    return {
        congregation_name: congregationName,
        congregation_id: congregation.id,
        staff_members: staffMembers
    };
}

async function createStaffProfile(
    staffMember: CSVStaffMember,
    congregationId: string,
    supabase: any
): Promise<any> {
    // Parse name into first and last name
    const nameParts = staffMember.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Check if profile already exists
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('congregation_id', congregationId)
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

    if (existing) {
        // Update existing profile
        const { data, error } = await supabase
            .from('profiles')
            .update({
                title: staffMember.title,
                cellphone: staffMember.cellphone,
                email: staffMember.email,
                photo_url: staffMember.photo_url,
                app_roles: staffMember.roles,
                portfolio: staffMember.portfolio,
                active: true
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        // Create new profile (without user_id - will be linked later during auth)
        const { data, error } = await supabase
            .from('profiles')
            .insert([{
                congregation_id: congregationId,
                first_name: firstName,
                last_name: lastName,
                title: staffMember.title,
                cellphone: staffMember.cellphone,
                email: staffMember.email,
                photo_url: staffMember.photo_url,
                app_roles: staffMember.roles,
                portfolio: staffMember.portfolio,
                active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

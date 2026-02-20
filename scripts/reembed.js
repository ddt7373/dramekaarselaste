/**
 * Re-embed all omsendbrief chunks using gemini-embedding-001
 * This replaces the old text-embedding-004 embeddings that were deprecated on Jan 14, 2026
 */

const SUPABASE_URL = 'https://wskkdnzeqgdjxqozyfut.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indza2tkbnplcWdkanhxb3p5ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTI0NjksImV4cCI6MjA4NDcyODQ2OX0.-3meCJRS113LZvD6sSk0P5--Axrnuk39bjAnCK9BSv0';

// We need the service role key to update embeddings directly
// Instead, we'll call the edge function to re-process each document

async function getDocuments() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/omsendbrief_dokumente?select=id,filename,status,chunk_count,content&status=eq.ready&order=created_at.asc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
    });
    return await res.json();
}

async function reprocessDocument(doc) {
    if (!doc.content || doc.content.trim().length === 0) {
        console.log(`  ⚠️  Geen inhoud vir ${doc.filename}, slaan oor`);
        return false;
    }

    // First delete old chunks
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/omsendbrief_chunks?dokument_id=eq.${doc.id}`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
    });

    if (!delRes.ok) {
        console.log(`  ❌ Kon nie ou chunks verwyder nie: ${delRes.statusText}`);
        return false;
    }

    // Call edge function to re-process
    const res = await fetch(`${SUPABASE_URL}/functions/v1/omsendbrief-ai`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
            type: 'process_document',
            data: {
                dokument_id: doc.id,
                content: doc.content,
                filename: doc.filename,
            }
        })
    });

    const result = await res.json();
    if (result.success) {
        console.log(`  ✅ ${result.chunk_count} chunks`);
        return true;
    } else {
        console.log(`  ❌ Fout: ${result.error}`);
        return false;
    }
}

async function main() {
    console.log('🔄 Haal dokumente op...');
    const docs = await getDocuments();
    console.log(`📄 ${docs.length} dokumente gevind\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        console.log(`[${i + 1}/${docs.length}] ${doc.filename}`);

        try {
            const result = await reprocessDocument(doc);
            if (result) {
                success++;
            } else {
                skipped++;
            }
        } catch (err) {
            console.log(`  ❌ Fout: ${err.message}`);
            failed++;
        }

        // Rate limiting - 1 second between documents to avoid hitting API limits
        if (i < docs.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log(`\n📊 Klaar!`);
    console.log(`  ✅ Suksesvol: ${success}`);
    console.log(`  ⚠️  Oorgeslaan: ${skipped}`);
    console.log(`  ❌ Misluk: ${failed}`);
}

main().catch(console.error);

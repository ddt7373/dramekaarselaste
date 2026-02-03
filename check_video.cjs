const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://yjlvvvvqfwzxwqxbhwvl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHZ2dnZxZnd6eHdxeGJod3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MjE5NjksImV4cCI6MjA1MDA5Nzk2OX0.vPVxnXQmLlNsqIgwAKmGBLnkbqYWnvdZbGGKGvYALYg'
);

async function checkVideo() {
    const { data, error } = await supabase
        .from('lms_lesse')
        .select('id, titel, tipe, video_url')
        .eq('tipe', 'video')
        .limit(3);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Video lessons:');
        data.forEach(les => {
            console.log(`\nID: ${les.id}`);
            console.log(`Title: ${les.titel}`);
            console.log(`Video URL (first 100 chars): ${(les.video_url || '').substring(0, 100)}`);
            console.log(`Contains <: ${(les.video_url || '').includes('<')}`);
        });
    }
}

checkVideo();

import { createClient } from '@supabase/supabase-js';

// Initialize database client
const supabaseUrl = 'https://wskkdnzeqgdjxqozyfut.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indza2tkbnplcWdkanhxb3p5ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTI0NjksImV4cCI6MjA4NDcyODQ2OX0.-3meCJRS113LZvD6sSk0P5--Axrnuk39bjAnCK9BSv0';

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
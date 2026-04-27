import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`\nRunning migration: ${file}`);
      
      const { error } = await supabase.rpc('execute_sql', { sql });
      
      if (error) {
        // Try direct SQL execution as fallback
        try {
          await supabase.rpc('sql', { query: sql });
        } catch (err) {
          console.log(`Note: If you see errors above, run the SQL manually in Supabase dashboard`);
          console.log(`File: ${file}`);
        }
      } else {
        console.log(`✓ Migration completed: ${file}`);
      }
    }

    console.log('\n✓ All migrations processed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();

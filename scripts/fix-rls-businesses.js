const fs = require('fs');
const path = require('path');

let token = process.env.SUPABASE_ACCESS_TOKEN || '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const match = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const projectRef = 'kuixombfmlwcaxbwcmmr';

async function fixRLS() {
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN is missing');
    return;
  }

  const sql = `
    -- Habilitar permisos de inserción y actualización en la tabla businesses para la administración del SaaS
    DROP POLICY IF EXISTS "Allow Insert Business" ON businesses;
    DROP POLICY IF EXISTS "Allow Update Business" ON businesses;

    CREATE POLICY "Allow Insert Business" ON businesses FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow Update Business" ON businesses FOR UPDATE USING (true);
  `;

  console.log('Actualizando políticas RLS de la tabla businesses en Supabase Postgres...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  console.log(`Resultado (${res.status}):`, text);
}

fixRLS();

require('dotenv').config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'kuixombfmlwcaxbwcmmr';

async function cleanup() {
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN is missing');
    return;
  }
  const sql = `DELETE FROM businesses WHERE slug LIKE 'test-rls-check%';`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  console.log('CLEANUP STATUS:', res.status);
}

cleanup();

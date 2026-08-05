const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const pass = 'iS7jAaKy4vQWo4*IWZJG';
const projectRef = 'kuixombfmlwcaxbwcmmr';

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'ca-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-south-1'
];

async function migrate() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  let connectedClient = null;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(pass)}@${host}:6543/postgres`;

    console.log(`Probando región AWS: ${region} (${host})...`);

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`🎉 ¡¡¡CONEXIÓN EXITOSA EN LA REGIÓN ${region.toUpperCase()}!!!`);
      connectedClient = client;
      break;
    } catch (err) {
      if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND')) {
        console.log(`⚠️ Respuesta en ${region}: ${err.message}`);
      }
    }
  }

  if (!connectedClient) {
    console.error('No se encontró el pooler de la región. Revisa Project Settings -> Database en Supabase.');
    process.exit(1);
  }

  try {
    console.log('Ejecutando script DDL de migración de esquema en Supabase...');
    await connectedClient.query(sqlContent);
    console.log('🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO EN SUPABASE!');

    // Insertar negocio demo inicial
    const seedSql = `
      INSERT INTO businesses (id, slug, nombre, ruc, telefono_whatsapp, direccion, logo_url, plan)
      VALUES (
        'b1010101-0000-0000-0000-000000000001',
        'panaderia-cuenca',
        'Café & Panadería El Sagrario',
        '0104598123001',
        '593987654321',
        'Calle Larga 8-23 y Luis Cordero, Cuenca',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
        'pro'
      )
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO categories (id, business_id, nombre, orden)
      VALUES 
        ('c1010101-0000-0000-0000-000000000001', 'b1010101-0000-0000-0000-000000000001', '🔥 Tradición Cuencana', 1),
        ('c1010101-0000-0000-0000-000000000002', 'b1010101-0000-0000-0000-000000000001', '☕ Cafetería Artesanal', 2)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO products (id, business_id, category_id, nombre, descripcion, precio, stock, imagen_url, disponible)
      VALUES
        ('p1010101-0000-0000-0000-000000000001', 'b1010101-0000-0000-0000-000000000001', 'c1010101-0000-0000-0000-000000000001', 'Humita Criolla con Queso Amasado', 'Humita de choclo tierno al vapor servida con queso fresco.', 1.75, 25, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&q=80', true),
        ('p1010101-0000-0000-0000-000000000002', 'b1010101-0000-0000-0000-000000000001', 'c1010101-0000-0000-0000-000000000001', 'Tamal Cuencano Especial', 'Tamal de maíz relleno de pollo, huevo duro y pasas.', 2.25, 20, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80', true),
        ('p1010101-0000-0000-0000-000000000003', 'b1010101-0000-0000-0000-000000000001', 'c1010101-0000-0000-0000-000000000002', 'Café de Pasada Tradicional', 'Café de altura lojano pasado en gota a gota.', 1.50, 50, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80', true)
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('Insertando datos semilla iniciales...');
    await connectedClient.query(seedSql);
    console.log('✅ ¡DATOS SEMILLA CREADOS EXITOSAMENTE EN SUPABASE!');
  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await connectedClient.end();
  }
}

migrate();

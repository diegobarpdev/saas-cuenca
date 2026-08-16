require('dotenv').config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'kuixombfmlwcaxbwcmmr';

async function seed() {
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN is missing');
    return;
  }
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
      'basico'
    )
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO categories (id, business_id, nombre, orden)
    VALUES 
      ('c1010101-0000-0000-0000-000000000001', 'b1010101-0000-0000-0000-000000000001', '🔥 Tradición Cuencana', 1),
      ('c1010101-0000-0000-0000-000000000002', 'b1010101-0000-0000-0000-000000000001', '☕ Cafetería Artesanal', 2)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO products (id, business_id, category_id, nombre, descripcion, precio, stock, imagen_url, disponible)
    VALUES
      ('a1010101-0000-0000-0000-000000000001', 'b1010101-0000-0000-0000-000000000001', 'c1010101-0000-0000-0000-000000000001', 'Humita Criolla con Queso Amasado', 'Humita de choclo tierno al vapor servida con queso fresco.', 1.75, 25, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&q=80', true),
      ('a1010101-0000-0000-0000-000000000002', 'b1010101-0000-0000-0000-000000000001', 'c1010101-0000-0000-0000-000000000001', 'Tamal Cuencano Especial', 'Tamal de maíz relleno de pollo, huevo duro y pasas.', 2.25, 20, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80', true),
      ('a1010101-0000-0000-0000-000000000003', 'b1010101-0000-0000-0000-000000000001', 'c1010101-0000-0000-0000-000000000002', 'Café de Pasada Tradicional', 'Café de altura lojano pasado en gota a gota.', 1.50, 50, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80', true)
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log('Enviando datos semilla a Supabase...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: seedSql }),
  });

  const text = await res.text();
  console.log(`Respuesta (${res.status}):`, text);
}

seed();

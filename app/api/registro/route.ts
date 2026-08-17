import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting en memoria — max 5 registros por IP por minuto
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'yapi_salt_2026').digest('hex');
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// GET /api/registro?slug=xxx — verificar disponibilidad de slug
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('slug') ?? '';
  const slug = sanitizeSlug(raw);
  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, slug });
  }
  const { data } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return NextResponse.json({ available: !data, slug });
}

// POST /api/registro — crear negocio + usuario admin
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento e intenta de nuevo.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      nombre_negocio,
      slug_raw,
      nombre_admin,
      email,
      password,
      telefono,
      honeypot, // campo trampa anti-bot — debe estar vacío
    } = body;

    // Anti-bot: si el honeypot tiene algo, rechazar silenciosamente
    if (honeypot) {
      return NextResponse.json({ success: true, slug: 'blocked' });
    }

    // ── Validaciones ──────────────────────────────────────────────────
    if (!nombre_negocio?.trim() || nombre_negocio.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre del negocio muy corto' }, { status: 400 });
    }
    if (!nombre_admin?.trim() || nombre_admin.trim().length < 2) {
      return NextResponse.json({ error: 'Tu nombre es requerido' }, { status: 400 });
    }
    const emailLower = email?.trim().toLowerCase();
    if (!emailLower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número' },
        { status: 400 }
      );
    }
    if (!telefono?.trim()) {
      return NextResponse.json({ error: 'Teléfono WhatsApp del negocio requerido' }, { status: 400 });
    }

    const slug = sanitizeSlug(slug_raw || nombre_negocio);
    if (!slug || slug.length < 3) {
      return NextResponse.json({ error: 'URL inválida. Usa letras, números o guiones (mínimo 3 caracteres)' }, { status: 400 });
    }

    // ── Unicidad ──────────────────────────────────────────────────────
    const [{ data: existingSlug }, { data: existingEmail }] = await Promise.all([
      supabase.from('businesses').select('id').eq('slug', slug).maybeSingle(),
      supabase.from('business_users_local').select('id').eq('email', emailLower).maybeSingle(),
    ]);

    if (existingSlug) {
      return NextResponse.json({ error: 'Esa URL ya está en uso. Elige otra.' }, { status: 409 });
    }
    if (existingEmail) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 });
    }

    // ── Crear negocio ─────────────────────────────────────────────────
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        slug,
        nombre: nombre_negocio.trim(),
        ruc: null,
        telefono_whatsapp: telefono.trim(),
        direccion: null,
        logo_url: null,
        plan: 'trial',
        datos_bancarios: { banco: '', tipo_cuenta: '', numero_cuenta: '', titular: '' },
        zonas_envio: [
          { id: 'z1', zona: 'Centro Histórico', costo: 1.50 },
          { id: 'z2', zona: 'Sector Norte', costo: 2.00 },
          { id: 'z3', zona: 'Sector Sur', costo: 2.00 },
        ],
        configuracion_operativa: {
          tiempo_preparacion: '15 - 25 min',
          permite_domicilio: true,
          permite_retiro: true,
          acepta_efectivo: true,
          acepta_transferencia: false,
          acepta_payphone: false,
          acepta_deuna: false,
        },
      })
      .select()
      .single();

    if (bizErr || !business) {
      console.error('[registro] Error creando negocio:', bizErr);
      return NextResponse.json({ error: 'Error al crear el negocio. Intenta nuevamente.' }, { status: 500 });
    }

    // ── Crear usuario admin ───────────────────────────────────────────
    const { data: newUser, error: userErr } = await supabase
      .from('business_users_local')
      .insert({
        business_id: business.id,
        email: emailLower,
        password_hash: hashPassword(password),
        nombre: nombre_admin.trim(),
        rol: 'dueño',
        activo: true,
      })
      .select('id')
      .single();

    if (userErr || !newUser) {
      // Rollback
      await supabase.from('businesses').delete().eq('id', business.id);
      console.error('[registro] Error creando usuario:', userErr);
      return NextResponse.json({ error: 'Error al crear la cuenta. Intenta nuevamente.' }, { status: 500 });
    }

    // ── Email de bienvenida ───────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kaltiro <hola@kaltiro.com>',
          to: [emailLower],
          subject: `¡Bienvenido a Kaltiro, ${nombre_negocio.trim()}!`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#070A11;color:#fff;padding:40px 24px;border-radius:16px;">
              <p style="font-size:28px;margin:0 0 4px;">🚀</p>
              <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">¡Ya eres parte de Kaltiro!</h1>
              <p style="color:#94a3b8;margin:0 0 24px;">Hola <strong style="color:#fff">${nombre_admin.trim()}</strong>, tu negocio está listo para recibir pedidos.</p>
              <div style="background:#0D1220;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Tu catálogo público</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#fe6a46;">kaltiro.com/${slug}</p>
                <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Comparte este link con tus clientes</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://kaltiro.com'}/app/login"
                style="display:inline-block;background:#fe6a46;color:#000;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
                Ir a mi panel →
              </a>
              <p style="color:#1e293b;font-size:11px;margin-top:32px;">Kaltiro.com · Software de Gestión para Restaurantes · Cuenca, Ecuador</p>
            </div>
          `,
        }),
      }).catch(e => console.error('[registro] Email bienvenida falló (no bloqueante):', e));
    }

    // ── Devolver sesión para auto-login ───────────────────────────────
    const session = {
      userId: newUser.id,
      email: emailLower,
      nombre: nombre_admin.trim(),
      rol: 'dueño',
      business,
    };

    return NextResponse.json({ success: true, session, slug });
  } catch (err: any) {
    console.error('[registro] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

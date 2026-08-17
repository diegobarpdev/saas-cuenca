import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting en memoria — max 5 por IP por minuto
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

export function hashPassword(password: string): string {
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

// POST /api/registro — crear pending registration + enviar email de confirmación
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
    const { nombre_admin, email, password, honeypot } = body;

    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    // Validaciones
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

    // Verificar que el email no esté ya registrado
    const { data: existingUser } = await supabase
      .from('business_users_local')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 });
    }

    // Eliminar cualquier pending previo con el mismo email
    await supabase.from('pending_registrations').delete().eq('email', emailLower);

    // Crear pending registration
    const token = randomBytes(32).toString('hex');
    const { error: pendingErr } = await supabase.from('pending_registrations').insert({
      nombre_admin: nombre_admin.trim(),
      email: emailLower,
      password_hash: hashPassword(password),
      token,
    });

    if (pendingErr) {
      console.error('[registro] Error creando pending:', pendingErr);
      return NextResponse.json({ error: 'Error interno. Intenta nuevamente.' }, { status: 500 });
    }

    // Enviar email de confirmación
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kaltiro.com';
    const verifyUrl = `${appUrl}/app/verificar?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kaltiro <info@kaltiro.com>',
          to: [emailLower],
          subject: 'Confirma tu cuenta en Kaltiro',
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#070A11;color:#fff;padding:40px 24px;border-radius:16px;">
              <p style="font-size:28px;margin:0 0 4px;">✉️</p>
              <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">Confirma tu cuenta</h1>
              <p style="color:#94a3b8;margin:0 0 24px;">
                Hola <strong style="color:#fff">${nombre_admin.trim()}</strong>, haz clic en el botón para confirmar tu correo y continuar con el registro de tu negocio.
              </p>
              <a href="${verifyUrl}"
                style="display:inline-block;background:#fe6a46;color:#000;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
                Confirmar mi cuenta →
              </a>
              <p style="color:#64748b;font-size:12px;margin-top:24px;">
                Este link expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.
              </p>
              <p style="color:#1e293b;font-size:11px;margin-top:32px;">Kaltiro.com · Software de Gestión para Restaurantes · Cuenca, Ecuador</p>
            </div>
          `,
        }),
      });
      if (!emailRes.ok) {
        const resendErr = await emailRes.text();
        console.error('[registro] Resend error', emailRes.status, resendErr);
      } else {
        console.log('[registro] Email enviado OK a', emailLower);
      }
    } else {
      console.log('[registro] RESEND_API_KEY no configurado. Verify URL:', verifyUrl);
    }

    return NextResponse.json({ success: true, email: emailLower });
  } catch (err: any) {
    console.error('[registro] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

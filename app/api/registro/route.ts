import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { sendMail } from '@/lib/mailer';

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

    try {
      await sendMail({
        to: emailLower,
        subject: '¡Confirma tu cuenta en Kaltiro!',
        html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirma tu cuenta en Kaltiro</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0f1623;border-radius:20px;border:1px solid #1e2a3a;overflow:hidden;">

          <!-- Header naranja -->
          <tr>
            <td style="background:linear-gradient(135deg,#fe6a46 0%,#e5522e 100%);padding:36px 40px 32px;text-align:center;">
              <img src="https://kaltiro.com/assets/KALTIRO_FONDO_PRINCIPAL.png"
                   alt="Kaltiro" width="56" height="56"
                   style="border-radius:14px;display:block;margin:0 auto 16px;" />
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.2;">
                Confirma tu correo
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">
                Ya casi terminas de crear tu cuenta
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;font-size:15px;color:#94a3b8;">Hola,</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:800;color:#f1f5f9;">
                ${nombre_admin.trim()} 👋
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.7;">
                Gracias por registrarte en <strong style="color:#fe6a46;">Kaltiro</strong>. Haz clic en el botón de abajo para confirmar tu correo electrónico y continuar configurando tu negocio.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#fe6a46,#e5522e);color:#fff;font-size:15px;font-weight:900;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(254,106,70,0.35);">
                      Confirmar mi cuenta &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="border-top:1px solid #1e2a3a;"></td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <p style="margin:0 0 6px;font-size:12px;color:#475569;">¿El botón no funciona? Copia este enlace en tu navegador:</p>
              <p style="margin:0;font-size:11px;color:#fe6a46;word-break:break-all;">${verifyUrl}</p>
            </td>
          </tr>

          <!-- Aviso caducidad -->
          <tr>
            <td style="background:#0b1120;padding:20px 40px;border-top:1px solid #1e2a3a;">
              <p style="margin:0;font-size:12px;color:#334155;text-align:center;">
                ⏱ Este enlace caduca en <strong style="color:#475569;">24 horas</strong>.
                Si no creaste esta cuenta, puedes ignorar este correo con seguridad.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#1e2a3a;">
                © ${new Date().getFullYear()} Kaltiro &middot; Software de gestión para restaurantes &middot; Cuenca, Ecuador
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
      console.log('[registro] Email enviado OK a', emailLower);
    } catch (mailErr) {
      console.error('[registro] Error enviando email:', mailErr);
      // No bloqueamos el registro si el email falla — el token queda en DB
    }

    return NextResponse.json({ success: true, email: emailLower });
  } catch (err: any) {
    console.error('[registro] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

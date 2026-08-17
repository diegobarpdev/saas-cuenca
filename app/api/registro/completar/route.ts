import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeSlug } from '../route';
import { sendMail } from '@/lib/mailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/registro/completar — crea negocio + usuario con el token verificado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, nombre_negocio, slug_raw, telefono } = body;

    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // Recuperar pending registration
    const { data: pending, error: pendingErr } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (pendingErr || !pending) {
      return NextResponse.json({ error: 'Link inválido o ya utilizado' }, { status: 404 });
    }

    if (new Date(pending.expires_at) < new Date()) {
      await supabase.from('pending_registrations').delete().eq('token', token);
      return NextResponse.json({ error: 'Este link expiró. Regístrate de nuevo.' }, { status: 410 });
    }

    // Validaciones del negocio
    if (!nombre_negocio?.trim() || nombre_negocio.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre del negocio muy corto' }, { status: 400 });
    }
    if (!telefono?.trim()) {
      return NextResponse.json({ error: 'WhatsApp del negocio requerido' }, { status: 400 });
    }

    const slug = sanitizeSlug(slug_raw || nombre_negocio);
    if (!slug || slug.length < 3) {
      return NextResponse.json({ error: 'URL inválida. Mínimo 3 caracteres.' }, { status: 400 });
    }

    // Verificar unicidad (slug + email)
    const [{ data: existingSlug }, { data: existingEmail }] = await Promise.all([
      supabase.from('businesses').select('id').eq('slug', slug).maybeSingle(),
      supabase.from('business_users_local').select('id').eq('email', pending.email).maybeSingle(),
    ]);

    if (existingSlug) {
      return NextResponse.json({ error: 'Esa URL ya está en uso. Elige otra.' }, { status: 409 });
    }
    if (existingEmail) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 });
    }

    // Crear negocio
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
      console.error('[completar] Error creando negocio:', bizErr);
      return NextResponse.json({ error: 'Error al crear el negocio. Intenta nuevamente.' }, { status: 500 });
    }

    // Crear usuario
    const { data: newUser, error: userErr } = await supabase
      .from('business_users_local')
      .insert({
        business_id: business.id,
        email: pending.email,
        password_hash: pending.password_hash,
        nombre: pending.nombre_admin,
        rol: 'dueño',
        activo: true,
      })
      .select('id')
      .single();

    if (userErr || !newUser) {
      await supabase.from('businesses').delete().eq('id', business.id);
      console.error('[completar] Error creando usuario:', userErr);
      return NextResponse.json({ error: 'Error al crear la cuenta. Intenta nuevamente.' }, { status: 500 });
    }

    // Eliminar pending registration
    await supabase.from('pending_registrations').delete().eq('token', token);

    // Email de bienvenida
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kaltiro.com';
    sendMail({
      to: pending.email,
      subject: `¡Bienvenido a Kaltiro, ${nombre_negocio.trim()}!`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#070A11;color:#fff;padding:40px 24px;border-radius:16px;">
          <p style="font-size:28px;margin:0 0 4px;">🚀</p>
          <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">¡Ya eres parte de Kaltiro!</h1>
          <p style="color:#94a3b8;margin:0 0 24px;">Hola <strong style="color:#fff">${pending.nombre_admin}</strong>, tu negocio está listo para recibir pedidos.</p>
          <div style="background:#0D1220;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Tu catálogo público</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#fe6a46;">kaltiro.com/${slug}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Comparte este link con tus clientes</p>
          </div>
          <a href="${appUrl}/app/login"
            style="display:inline-block;background:#fe6a46;color:#000;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
            Ir a mi panel →
          </a>
          <p style="color:#1e293b;font-size:11px;margin-top:32px;">Kaltiro.com · Software de Gestión para Restaurantes · Cuenca, Ecuador</p>
        </div>
      `,
    }).catch(e => console.error('[completar] Email bienvenida falló:', e));

    const session = {
      userId: newUser.id,
      email: pending.email,
      nombre: pending.nombre_admin,
      rol: 'dueño',
      business,
    };

    return NextResponse.json({ success: true, session, slug });
  } catch (err: any) {
    console.error('[completar] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

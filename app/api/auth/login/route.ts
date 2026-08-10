import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'yapi_salt_2026').digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // Buscar el usuario en business_users_local por email (puede pertenecer a cualquier negocio)
    const { data: user, error: userError } = await supabase
      .from('business_users_local')
      .select('*, business:businesses(*)')
      .eq('email', email.toLowerCase().trim())
      .eq('password_hash', passwordHash)
      .eq('activo', true)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    if (!user.business) {
      return NextResponse.json({ error: 'Negocio no encontrado. Contacta al administrador.' }, { status: 404 });
    }

    // Construir sesión segura
    const sessionData = {
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      business: user.business,
    };

    return NextResponse.json({ success: true, session: sessionData });
  } catch (err: any) {
    console.error('Error en login:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

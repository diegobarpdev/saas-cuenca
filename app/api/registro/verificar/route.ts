import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/registro/verificar?token=xxx
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';

  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pending_registrations')
    .select('nombre_admin, email, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Link inválido o ya utilizado' }, { status: 404 });
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('pending_registrations').delete().eq('token', token);
    return NextResponse.json({ error: 'Este link expiró. Regístrate de nuevo.' }, { status: 410 });
  }

  return NextResponse.json({ valid: true, nombre_admin: data.nombre_admin, email: data.email });
}

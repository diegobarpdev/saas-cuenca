// Envío de RIDE por email al cliente usando Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'facturas@kaltiro.com';

interface EnviarRideEmailParams {
  toEmail: string;
  toNombre: string;
  emisorNombre: string;
  numeroFactura: string;
  fechaEmision: string;
  total: number;
  pdfBuffer: Buffer;
  claveAcceso: string;
  tipoDocumento?: string; // default: 'Factura Electrónica'
  numeroDocumento?: string; // if different from numeroFactura
}

export async function enviarRideEmail(params: EnviarRideEmailParams): Promise<{ success: boolean; error?: string }> {
  const {
    toEmail, toNombre, emisorNombre, numeroFactura,
    fechaEmision, total, pdfBuffer, claveAcceso,
    tipoDocumento = 'Factura Electrónica',
    numeroDocumento,
  } = params;

  const numDoc = numeroDocumento ?? numeroFactura;
  const totalStr = `$${total.toFixed(2)}`;
  const labelNumDoc = tipoDocumento === 'Factura Electrónica' ? 'Número de Factura'
    : tipoDocumento === 'Nota de Crédito' ? 'Número de Nota de Crédito'
    : tipoDocumento === 'Comprobante de Retención' ? 'Número de Retención'
    : 'Número de Documento';

  try {
    const { error } = await resend.emails.send({
      from: `${emisorNombre} <${FROM_EMAIL}>`,
      to: [toEmail],
      subject: `Tu ${tipoDocumento.toLowerCase()} ${numDoc} — ${emisorNombre}`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tipoDocumento}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#FE6A46;padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
              ${tipoDocumento}
            </h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
              ${emisorNombre}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;color:#374151;font-size:15px;">
              Hola <strong>${toNombre}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">
              Adjunto encontrarás tu ${tipoDocumento.toLowerCase()} autorizado por el SRI.
            </p>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;">
                        <span style="color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${labelNumDoc}</span><br>
                        <span style="color:#111827;font-size:14px;font-weight:700;font-family:monospace;">${numDoc}</span>
                      </td>
                      <td style="padding:5px 0;" align="right">
                        <span style="color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</span><br>
                        <span style="color:#FE6A46;font-size:20px;font-weight:800;">${totalStr}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:12px;border-top:1px solid #E5E7EB;">
                        <span style="color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Fecha de Emisión</span><br>
                        <span style="color:#374151;font-size:13px;">${fechaEmision}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;color:#6B7280;font-size:12px;">
              Puedes verificar la validez del documento en el portal del SRI:
            </p>
            <a href="https://srienlinea.sri.gob.ec" style="color:#FE6A46;font-size:12px;text-decoration:none;font-weight:600;">
              srienlinea.sri.gob.ec →
            </a>

            <p style="margin:20px 0 4px;color:#9CA3AF;font-size:11px;">Clave de acceso:</p>
            <p style="margin:0;color:#6B7280;font-size:10px;font-family:monospace;word-break:break-all;background:#F3F4F6;padding:8px 12px;border-radius:8px;">
              ${claveAcceso}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:11px;">
              Este es un correo automático enviado por ${emisorNombre} a través de Kaltiro.com.<br>
              Documento electrónico autorizado por el SRI Ecuador.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim(),
      attachments: [
        {
          filename: `${tipoDocumento.toLowerCase().replace(/\s+/g, '-')}-${numDoc.replace(/-/g, '')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Error enviando email' };
  }
}

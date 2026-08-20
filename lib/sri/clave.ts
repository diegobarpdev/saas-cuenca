// Generador de Clave de Acceso para comprobantes SRI Ecuador
// Formato: DDMMAAAA(8) + tipoDoc(2) + RUC(13) + ambiente(1) + serie(6) + secuencial(9) + codNumerico(8) + tipoEmision(1) + verificador(1)
// Total: 49 dígitos

function modulo11(clave48: string): number {
  const factores = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  for (let i = clave48.length - 1, f = 0; i >= 0; i--, f = (f + 1) % 6) {
    suma += parseInt(clave48[i]) * factores[f];
  }
  const residuo = suma % 11;
  if (residuo === 0) return 0;
  if (residuo === 1) return 1;
  return 11 - residuo;
}

function randomCodNumerico(): string {
  return Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
}

function formatFecha(date: Date): string {
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const aaaa = date.getFullYear().toString();
  return `${dd}${mm}${aaaa}`;
}

export function generarClaveAcceso(params: {
  fecha: Date;
  tipoComprobante: '01' | '02' | '04' | '07'; // 01=factura, 04=nota crédito, 07=retención
  ruc: string;           // 13 dígitos
  ambiente: '1' | '2';  // 1=pruebas, 2=produccion
  establecimiento: string; // 3 dígitos
  puntoEmision: string;    // 3 dígitos
  secuencial: number;
  tipoEmision?: '1';       // 1 = emisión normal
}): string {
  const {
    fecha,
    tipoComprobante = '01',
    ruc,
    ambiente,
    establecimiento,
    puntoEmision,
    secuencial,
    tipoEmision = '1',
  } = params;

  const fechaStr = formatFecha(fecha);
  const rucStr = ruc.padStart(13, '0');
  const serieStr = establecimiento.padStart(3, '0') + puntoEmision.padStart(3, '0');
  const secuencialStr = secuencial.toString().padStart(9, '0');
  const codNumerico = randomCodNumerico();

  const clave48 =
    fechaStr +
    tipoComprobante +
    rucStr +
    ambiente +
    serieStr +
    secuencialStr +
    codNumerico +
    tipoEmision;

  const verificador = modulo11(clave48);

  return clave48 + verificador.toString();
}

export function secuencialToString(secuencial: number): string {
  return secuencial.toString().padStart(9, '0');
}

export function numeroFactura(estab: string, pto: string, secuencial: number): string {
  return `${estab.padStart(3, '0')}-${pto.padStart(3, '0')}-${secuencialToString(secuencial)}`;
}

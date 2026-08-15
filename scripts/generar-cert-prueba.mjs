/**
 * Generador de certificado .p12 de PRUEBA para SRI Ecuador
 * Uso: node scripts/generar-cert-prueba.mjs
 *
 * Genera un certificado autofirmado válido para el ambiente de pruebas del SRI.
 * NUNCA usar en producción — para producción obtener certificado del BCE o Security Data.
 */

import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'certs');
const PASSWORD = 'kaltiro2024';

console.log('Generando certificado de prueba para SRI Ecuador...\n');

// 1. Generar par de claves RSA 2048
console.log('1/4 Generando clave RSA 2048...');
const keys = forge.pki.rsa.generateKeyPair(2048);

// 2. Crear certificado X.509
console.log('2/4 Creando certificado X.509...');
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = Date.now().toString(16).toUpperCase();

cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 5);

const attrs = [
  { name: 'commonName',         value: 'CERTIFICADO PRUEBA SRI' },
  { name: 'countryName',        value: 'EC' },
  { name: 'stateOrProvinceName',value: 'AZUAY' },
  { name: 'localityName',       value: 'CUENCA' },
  { name: 'organizationName',   value: 'KALTIRO PRUEBAS' },
  { name: 'emailAddress',       value: 'pruebas@kaltiro.com' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([
  { name: 'basicConstraints', cA: true },
  { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true },
  { name: 'subjectKeyIdentifier' },
]);

// Firmar con SHA256
cert.sign(keys.privateKey, forge.md.sha256.create());
console.log('3/4 Certificado firmado correctamente.');

// 3. Empaquetar como PKCS#12
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], PASSWORD, {
  algorithm: '3des',
  friendlyName: 'KALTIRO PRUEBAS',
});
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Buffer = Buffer.from(p12Der, 'binary');

// 4. Guardar
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const p12Path = path.join(OUT_DIR, 'cert-prueba.p12');
fs.writeFileSync(p12Path, p12Buffer);

// También guardar base64 para copiar fácilmente
const p12B64 = p12Buffer.toString('base64');
fs.writeFileSync(path.join(OUT_DIR, 'cert-prueba.b64'), p12B64);

console.log('4/4 Archivos generados.\n');
console.log('━'.repeat(50));
console.log(`✓ Certificado: ${p12Path}`);
console.log(`✓ Base64:      ${path.join(OUT_DIR, 'cert-prueba.b64')}`);
console.log(`✓ Contraseña:  ${PASSWORD}`);
console.log('━'.repeat(50));
console.log('\nPara usar:');
console.log('  1. Ve a /{slug}/admin/sri-config');
console.log('  2. Sube el archivo cert-prueba.p12');
console.log(`  3. Ingresa la contraseña: ${PASSWORD}`);
console.log('  4. Selecciona ambiente: PRUEBAS');
console.log('  5. Guarda y ya puedes emitir facturas de prueba.\n');

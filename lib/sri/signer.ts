import forge from 'node-forge';
import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import { C14nCanonicalization } from 'xml-crypto';

// Canonicalización C14N real (RFC REC-xml-c14n-20010315) vía xml-crypto,
// en vez de aproximarla a mano con regex. Evita errores de namespaces,
// expansión de tags vacíos y escapado que antes causaban [39] FIRMA INVALIDA.
const c14n = new C14nCanonicalization();

function canonicalizeXml(xmlString: string): string {
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
  return c14n.process(doc.documentElement, {});
}

function sha256Base64(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('base64');
}

function rsaSha256Sign(privateKey: forge.pki.PrivateKey, data: string): string {
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  const signature = (privateKey as any).sign(md);
  return forge.util.encode64(signature);
}

interface P12Data {
  privateKey: forge.pki.PrivateKey;
  certificate: forge.pki.Certificate;
  certBase64: string;
  certDigestB64: string;
  issuerDN: string;
  serialNumber: string;
}

function loadP12(p12Base64: string, password: string): P12Data {
  const p12Der = forge.util.decode64(p12Base64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) {
    // Try keyBag type
    const kb2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
    const k2 = kb2[forge.pki.oids.keyBag]?.[0];
    if (!k2?.key) throw new Error('No se encontró la clave privada en el certificado .p12');
  }

  const privateKey = (keyBag?.key ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0]?.key) as forge.pki.PrivateKey;

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const allCerts = certBags[forge.pki.oids.certBag] ?? [];
  // Buscar el certificado cuyo módulo RSA coincide con la clave privada.
  // El P12 puede tener varios certificados (entidad + cadena CA) y [0] no
  // siempre es el de la entidad — tomar el incorrecto causa [39] FIRMA INVALIDA.
  let certificate = allCerts.find((bag) => {
    const pub = (bag.cert?.publicKey as any);
    const priv = (privateKey as any);
    return pub?.n && priv?.n && pub.n.equals(priv.n);
  })?.cert ?? allCerts[0]?.cert;
  if (!certificate) throw new Error('No se encontró el certificado en el .p12');

  // Certificado en DER → base64
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
  const certBase64 = forge.util.encode64(certDer);

  // SHA256 del certificado DER
  const certDigest = crypto.createHash('sha256').update(Buffer.from(certDer, 'binary')).digest('base64');

  // IssuerName y SerialNumber
  // X509IssuerName debe ir en formato RFC 2253 (más específico primero: CN, OU, O, ..., C).
  // forge devuelve los atributos en el orden de codificación DER del certificado
  // (jerárquico, de raíz a hoja: C, O, OU, CN), por lo que hay que invertirlo.
  const issuerDN = certificate.issuer.attributes
    .slice()
    .reverse()
    .map((a: any) => `${a.shortName}=${a.value}`)
    .join(',');
  // Usar BigInt para evitar pérdida de precisión en seriales grandes
  const serialNumber = BigInt('0x' + certificate.serialNumber).toString(10);

  return {
    privateKey,
    certificate,
    certBase64,
    certDigestB64: certDigest,
    issuerDN,
    serialNumber,
  };
}

export function firmarXml(xmlSinFirma: string, p12Base64: string, password: string): string {
  const p12 = loadP12(p12Base64, password);
  const signingTime = new Date().toISOString();
  const signatureId = 'Signature';
  const signedPropsId = 'Signature_SignedProperties';
  const objectId = 'Signature_Object';

  // 1. Canonicalizar el XML (sin firma) y computar su digest.
  // El verificador del SRI recibe este mismo documento, quita el nodo
  // ds:Signature (transform enveloped-signature) y canonicaliza el resto —
  // como nunca insertamos una copia distinta del documento, firmante y
  // verificador siempre canonicalizan exactamente los mismos bytes.
  const docCanonical = canonicalizeXml(xmlSinFirma);
  const docDigest = sha256Base64(docCanonical);

  // 2. Construir SignedProperties y canonicalizarlo con C14N real.
  // Se usa la forma CANÓNICA (no la plantilla original) para calcular el
  // digest Y para embeberla en el documento final — así ambas son
  // idénticas por construcción, sin depender de que la plantilla ya
  // estuviera "casualmente" en forma canónica.
  // xmlns:ds se declara en la raíz de SignedProperties porque en el documento
  // final este nodo hereda xmlns:ds del ancestro <ds:Signature xmlns:ds="...">.
  // C14N inclusivo renderiza TODOS los namespaces en scope en el elemento raíz
  // del subset que se canonicaliza. Si el standalone no los declara, el digest
  // que calculamos difiere del que verifica el SRI → [39] FIRMA INVALIDA.
  const signedPropsTemplate = `<xades:SignedProperties xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropsId}"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${p12.certDigestB64}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName>${p12.issuerDN}</ds:X509IssuerName><ds:X509SerialNumber>${p12.serialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`;
  const signedPropsXml = canonicalizeXml(signedPropsTemplate);
  const signedPropsDigest = sha256Base64(signedPropsXml);

  // 3. Construir SignedInfo
  const signedInfoTemplate = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod><ds:Reference Id="comprobante-ref" URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${docDigest}</ds:DigestValue></ds:Reference><ds:Reference Id="xades-ref" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropsId}"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${signedPropsDigest}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;

  // 4. Canonicalizar SignedInfo y firmarlo (XMLDSig exige firmar la forma
  // canónica, nunca el XML "tal cual se escribió").
  const signedInfoXml = canonicalizeXml(signedInfoTemplate);
  const signatureValue = rsaSha256Sign(p12.privateKey, signedInfoXml);

  // 5. Ensamblar el bloque <ds:Signature>. Se embeben signedInfoXml y
  // signedPropsXml — las formas canónicas ya calculadas arriba — para que
  // lo firmado y lo publicado sean bit a bit lo mismo.
  const signatureBlock = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signatureId}">${signedInfoXml}<ds:SignatureValue Id="SignatureValue">${signatureValue}</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>${p12.certBase64}</ds:X509Certificate></ds:X509Data></ds:KeyInfo><ds:Object Id="${objectId}"><xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${signatureId}">${signedPropsXml}</xades:QualifyingProperties></ds:Object></ds:Signature>`;

  // 6. Inyectar la firma antes del cierre del elemento raíz
  const closingTag = xmlSinFirma.match(/<\/([a-zA-Z_][a-zA-Z0-9_:.-]*)>\s*$/)?.[0];
  if (!closingTag) throw new Error('No se pudo encontrar el elemento raíz para insertar la firma');

  const xmlFirmado = xmlSinFirma.replace(
    new RegExp(closingTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'),
    signatureBlock + closingTag,
  );

  return xmlFirmado;
}

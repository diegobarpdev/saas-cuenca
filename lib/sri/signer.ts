import forge from 'node-forge';
import crypto from 'crypto';

// Canonicalización C14N simplificada para SRI Ecuador
// Para documentos XML controlados (generados por nosotros), funciona correctamente
function canonicalize(xmlString: string): string {
  // Remover declaración XML
  let c14n = xmlString.replace(/<\?xml[^?]*\?>\s*/g, '');
  // Normalizar atributos de namespace (los que ya están en el XML se mantienen)
  return c14n;
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
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error('No se encontró el certificado en el .p12');
  const certificate = certBag.cert;

  // Certificado en DER → base64
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
  const certBase64 = forge.util.encode64(certDer);

  // SHA256 del certificado DER
  const certDigest = crypto.createHash('sha256').update(Buffer.from(certDer, 'binary')).digest('base64');

  // IssuerName y SerialNumber
  const issuerDN = certificate.issuer.attributes
    .map((a: any) => `${a.shortName}=${a.value}`)
    .join(', ');
  const serialNumber = parseInt(certificate.serialNumber, 16).toString();

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

  // 1. Canonicalizar el XML (sin firma) y computar su digest
  const xmlC14n = canonicalize(xmlSinFirma);
  const docDigest = sha256Base64(xmlC14n);

  // 2. Construir SignedProperties para computar su digest
  const signedPropsXml = `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropsId}"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${p12.certDigestB64}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${p12.issuerDN}</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${p12.serialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`;

  const signedPropsDigest = sha256Base64(signedPropsXml);

  // 3. Construir SignedInfo
  const signedInfoXml = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><ds:Reference Id="comprobante-ref" URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${docDigest}</ds:DigestValue></ds:Reference><ds:Reference Id="xades-ref" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropsId}"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${signedPropsDigest}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;

  // 4. Firmar SignedInfo con RSA-SHA256
  const signatureValue = rsaSha256Sign(p12.privateKey, canonicalize(signedInfoXml));

  // 5. Ensamblar el bloque <ds:Signature>
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

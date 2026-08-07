/**
 * Compresión y Optimización de Imágenes en el Cliente (Browser Canvas)
 * Reduce fotos de 10MB+ a ~150KB en formato WEBP/JPEG manteniedo nitidez y calidad visual.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  // Si no es un archivo de imagen, devolver el original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional respetando el aspecto original
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Crear canvas para redimensionar y procesar la imagen
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Renderizar suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir canvas a Blob comprimido (WebP o JPEG de calidad óptima)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // Cambiar extensión a .webp
            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || 'producto';
            const compressedFileName = `${originalName}.webp`;

            const compressedFile = new File([blob], compressedFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            console.log(
              `Optimización completada: ${(file.size / 1024).toFixed(1)} KB -> ${(
                compressedFile.size / 1024
              ).toFixed(1)} KB (Ahorro: ${(
                (1 - compressedFile.size / file.size) *
                100
              ).toFixed(0)}%)`
            );

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

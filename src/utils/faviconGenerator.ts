import { ConversionConfig } from '@/components/ConversionSettings';

export interface FaviconPackage {
  files: { name: string; blob: Blob; type: string }[];
  htmlCode: string;
  zipBlob?: Blob;
  filename: string;
}

export const generateFaviconPackage = async (
  imageFile: File,
  icoBlob: Blob,
  resolutions: { size: number; canvas: HTMLCanvasElement }[],
  config: ConversionConfig
): Promise<FaviconPackage> => {
  const files: { name: string; blob: Blob; type: string }[] = [];
  const filename = config.filename || 'favicon';

  // Add ICO file
  files.push({ name: `${filename}.ico`, blob: icoBlob, type: 'image/x-icon' });

  // Generate and add PNG files
  if (config.includePNG || config.generateFaviconPackage) {
    const pngSizes = config.generateFaviconPackage 
      ? [16, 32, 180, 192, 512] 
      : config.selectedSizes;

    for (const size of pngSizes) {
      const resolution = resolutions.find(r => r.size === size);
      const canvas = resolution ? resolution.canvas : resolutions[resolutions.length - 1].canvas; // Fallback to largest

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create PNG')), 'image/png');
      });
      
      let pngFilename = `${filename}-${size}x${size}.png`;
      if (size === 180) pngFilename = 'apple-touch-icon.png';
      if (size === 192) pngFilename = `android-chrome-192x192.png`;
      if (size === 512) pngFilename = `android-chrome-512x512.png`;

      files.push({ name: pngFilename, blob: pngBlob, type: 'image/png' });
    }
  }

  // Generate and add WebP files
  if (config.includeWebP) {
    for (const { size, canvas } of resolutions) {
      if (config.selectedSizes.includes(size)) {
        const webpBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create WebP')), 'image/webp', config.quality);
        });
        files.push({ name: `${filename}-${size}x${size}.webp`, blob: webpBlob, type: 'image/webp' });
      }
    }
  }

  // Generate HTML code
  const htmlCode = generateHTMLCode(filename);

  // Create ZIP file
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  files.forEach(file => {
    zip.file(file.name, file.blob);
  });
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  return { files, htmlCode, zipBlob, filename };
};

const generateHTMLCode = (filename: string): string => {
  const lines = [
    `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`,
    `<link rel="icon" href="/favicon.ico" sizes="any">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/${filename}-32x32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="/${filename}-16x16.png">`
  ];
  return lines.join('\n');
};


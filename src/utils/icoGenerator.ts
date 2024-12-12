// import { ConversionConfig } from '@/components/ConversionSettings';

const lanczosResize = (
  source: HTMLImageElement | ImageData,
  destWidth: number,
  destHeight: number,
): ImageData => {
  const srcCanvas = document.createElement("canvas");
  const srcCtx = srcCanvas.getContext("2d")!;

  if (source instanceof HTMLImageElement) {
    srcCanvas.width = source.width;
    srcCanvas.height = source.height;
    srcCtx.drawImage(source, 0, 0);
  } else {
    srcCanvas.width = source.width;
    srcCanvas.height = source.height;
    srcCtx.putImageData(source, 0, 0);
  }

  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const destData = new ImageData(destWidth, destHeight);

  const lanczos = (x: number, a: number = 3): number => {
    if (x === 0) return 1;
    if (Math.abs(x) >= a) return 0;
    x *= Math.PI;
    return (a * Math.sin(x) * Math.sin(x / a)) / (x * x);
  };

  const scaleX = srcCanvas.width / destWidth;
  const scaleY = srcCanvas.height / destHeight;

  const promises = [];
  for (let destY = 0; destY < destHeight; destY++) {
    promises.push(
      new Promise<void>((resolve) => {
        for (let destX = 0; destX < destWidth; destX++) {
          const srcX = destX * scaleX;
          const srcY = destY * scaleY;

          let r = 0,
            g = 0,
            b = 0,
            a = 0,
            totalWeight = 0;

          const startX = Math.floor(srcX - 3);
          const endX = Math.ceil(srcX + 3);
          const startY = Math.floor(srcY - 3);
          const endY = Math.ceil(srcY + 3);

          for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
              if (
                x >= 0 &&
                x < srcCanvas.width &&
                y >= 0 &&
                y < srcCanvas.height
              ) {
                const weight = lanczos(x - srcX) * lanczos(y - srcY);
                if (weight > 0) {
                  const idx = (y * srcCanvas.width + x) * 4;
                  r += srcData.data[idx] * weight;
                  g += srcData.data[idx + 1] * weight;
                  b += srcData.data[idx + 2] * weight;
                  a += srcData.data[idx + 3] * weight;
                  totalWeight += weight;
                }
              }
            }
          }

          const destIdx = (destY * destWidth + destX) * 4;
          destData.data[destIdx] = r / totalWeight;
          destData.data[destIdx + 1] = g / totalWeight;
          destData.data[destIdx + 2] = b / totalWeight;
          destData.data[destIdx + 3] = a / totalWeight;
        }
        resolve();
      }),
    );
  }

  Promise.all(promises);
  return destData;
};

const applySharpen = (imageData: ImageData, strength: number): void => {
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = imageData.data;
  const sw = imageData.width;
  const sh = imageData.height;
  const w = sw;
  const h = sh;
  const dst = new Uint8ClampedArray(src);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
          const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
          const srcOff = (scy * sw + scx) * 4;
          const wt = weights[cy * side + cx];
          r += src[srcOff] * wt;
          g += src[srcOff + 1] * wt;
          b += src[srcOff + 2] * wt;
          a += src[srcOff + 3] * wt;
        }
      }
      dst[dstOff] = r * strength + src[dstOff] * (1 - strength);
      dst[dstOff + 1] = g * strength + src[dstOff + 1] * (1 - strength);
      dst[dstOff + 2] = b * strength + src[dstOff + 2] * (1 - strength);
    }
  }
  imageData.data.set(dst);
};

const applyContrast = (imageData: ImageData, contrast: number): void => {
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }
};

const resizeWithSteps = (
  img: HTMLImageElement,
  destWidth: number,
  destHeight: number,
): ImageData => {
  let currentCanvas = document.createElement("canvas");
  const currentCtx = currentCanvas.getContext("2d")!;

  currentCanvas.width = img.width;
  currentCanvas.height = img.height;
  currentCtx.drawImage(img, 0, 0);

  let currentWidth = img.width;
  let currentHeight = img.height;

  while (currentWidth / 2 >= destWidth) {
    const nextWidth = Math.floor(currentWidth / 2);
    const nextHeight = Math.floor(currentHeight / 2);

    const nextCanvas = document.createElement("canvas");
    nextCanvas.width = nextWidth;
    nextCanvas.height = nextHeight;

    const nextCtx = nextCanvas.getContext("2d")!;
    nextCtx.imageSmoothingQuality = "high";
    nextCtx.drawImage(
      currentCanvas,
      0,
      0,
      currentWidth,
      currentHeight,
      0,
      0,
      nextWidth,
      nextHeight,
    );

    currentCanvas = nextCanvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = destWidth;
  finalCanvas.height = destHeight;
  const finalCtx = finalCanvas.getContext("2d")!;
  finalCtx.imageSmoothingQuality = "high";
  finalCtx.drawImage(
    currentCanvas,
    0,
    0,
    currentWidth,
    currentHeight,
    0,
    0,
    destWidth,
    destHeight,
  );

  return finalCtx.getImageData(0, 0, destWidth, destHeight);
};

const imageDataToBlob = async (
  imageData: ImageData,
  quality: number,
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png", quality);
  });
};

export interface IcoGenerationOptions {
  sizes: number[];
  quality?: number;
}

export interface RasterizationOptions {
  preserveAspectRatio: boolean;
  backgroundTransparent: boolean;
  backgroundColor: string; // CSS color like #RRGGBB
  crispSmallIcons?: boolean;
}

export interface GeneratedIco {
  icoBlob: Blob;
  resolutions: { size: number; canvas: HTMLCanvasElement; dataUrl: string }[];
  fileSize: number;
}

export interface IcoGenerationProgress {
  progress: number;
  currentStep: string;
}

const createIcoFile = (
  pngBuffers: { buffer: ArrayBuffer; size: number }[],
): ArrayBuffer => {
  const iconCount = pngBuffers.length;

  const headerSize = 6;
  const directorySize = iconCount * 16;
  const totalHeaderSize = headerSize + directorySize;

  let totalSize = totalHeaderSize;
  pngBuffers.forEach(({ buffer }) => (totalSize += buffer.byteLength));

  const icoBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(icoBuffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, iconCount, true);

  let offset = totalHeaderSize;
  let directoryOffset = 6;

  pngBuffers.forEach(({ buffer, size }) => {
    view.setUint8(directoryOffset, size === 256 ? 0 : size);
    view.setUint8(directoryOffset + 1, size === 256 ? 0 : size);
    view.setUint8(directoryOffset + 2, 0);
    view.setUint8(directoryOffset + 3, 0);
    view.setUint16(directoryOffset + 4, 1, true);
    view.setUint16(directoryOffset + 6, 32, true);
    view.setUint32(directoryOffset + 8, buffer.byteLength, true);
    view.setUint32(directoryOffset + 12, offset, true);

    new Uint8Array(icoBuffer, offset).set(new Uint8Array(buffer));

    offset += buffer.byteLength;
    directoryOffset += 16;
  });

  return icoBuffer;
};

const SECURITY_LIMITS = {
  maxProcessingTime: 60000,
  maxMemoryUsage: 100 * 1024 * 1024,
  maxConcurrentOperations: 1,
  maxCanvasSize: 4096 * 4096 * 4,
};

let isProcessing = false;
let processingStartTime = 0;

const memoryTracker = {
  canvases: new Set<HTMLCanvasElement>(),
  imageData: new Set<ImageData>(),
  blobs: new Set<Blob>(),

  add(item: HTMLCanvasElement | ImageData | Blob) {
    if (item instanceof HTMLCanvasElement) {
      this.canvases.add(item);
    } else if (item instanceof ImageData) {
      this.imageData.add(item);
    } else if (item instanceof Blob) {
      this.blobs.add(item);
    }
  },

  cleanup() {
    this.canvases.forEach((canvas) => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 1;
      canvas.height = 1;
    });
    this.canvases.clear();

    this.imageData.clear();

    this.blobs.clear();

    if (window.gc) {
      window.gc();
    }
  },

  getEstimatedMemoryUsage(): number {
    let totalMemory = 0;

    this.canvases.forEach((canvas) => {
      totalMemory += canvas.width * canvas.height * 4; // RGBA
    });

    this.imageData.forEach((imageData) => {
      totalMemory += imageData.data.length;
    });

    this.blobs.forEach((blob) => {
      totalMemory += blob.size;
    });

    return totalMemory;
  },
};

const withTimeout = <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

const processImageSecurely = async (
  file: File,
  sizes: number[],
  onProgress?: (progress: number, step: string) => void,
  rasterOptions?: Partial<RasterizationOptions>,
): Promise<GeneratedIco> => {
  if (isProcessing) {
    throw new Error(
      "Processamento já em andamento. Aguarde a conclusão da operação atual.",
    );
  }

  isProcessing = true;
  processingStartTime = Date.now();

  try {
    if (!file || file.size === 0) {
      throw new Error("Arquivo inválido");
    }

    if (!sizes || sizes.length === 0) {
      throw new Error("Tamanhos de ícone não especificados");
    }

    if (file.size > SECURITY_LIMITS.maxMemoryUsage / 2) {
      throw new Error("Arquivo muito grande para processamento seguro");
    }

    memoryTracker.cleanup();

    onProgress?.(5, "Validando arquivo...");

    const img = await withTimeout(
      () => loadImageFromFile(file),
      30000,
      "Timeout: Carregamento da imagem demorou muito tempo",
    );

    const totalPixels = img.width * img.height;
    if (totalPixels > SECURITY_LIMITS.maxCanvasSize / 4) {
      throw new Error(
        "Imagem muito grande. Use uma imagem menor para evitar problemas de performance.",
      );
    }

    onProgress?.(15, "Processando imagem...");

    const isSvg = file.type === "image/svg+xml";
    const icoData = await withTimeout(
      () =>
        generateIcoWithMemoryTracking(img, sizes, onProgress, isSvg, {
          preserveAspectRatio: rasterOptions?.preserveAspectRatio ?? true,
          backgroundTransparent: rasterOptions?.backgroundTransparent ?? true,
          backgroundColor: rasterOptions?.backgroundColor ?? "#000000",
          crispSmallIcons: rasterOptions?.crispSmallIcons ?? true,
        }),
      SECURITY_LIMITS.maxProcessingTime,
      "Timeout: Processamento demorou muito tempo. Tente com uma imagem menor.",
    );

    onProgress?.(100, "Concluído!");

    return icoData;
  } catch (error) {
    console.error("Secure processing error:", error);
    throw error;
  } finally {
    isProcessing = false;
    processingStartTime = 0;
    memoryTracker.cleanup();
  }
};

const generateIcoWithMemoryTracking = async (
  img: HTMLImageElement,
  sizes: number[],
  onProgress?: (progress: number, step: string) => void,
  isSvg: boolean = false,
  options: RasterizationOptions = {
    preserveAspectRatio: true,
    backgroundTransparent: true,
    backgroundColor: "#000000",
  },
): Promise<GeneratedIco> => {
  const resizedImages: { size: number; imageData: ImageData }[] = [];
  const progressStep = 70 / sizes.length;

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];

    const currentMemory = memoryTracker.getEstimatedMemoryUsage();
    if (currentMemory > SECURITY_LIMITS.maxMemoryUsage) {
      throw new Error(
        "Limite de memória excedido. Tente com uma imagem menor ou menos tamanhos.",
      );
    }

    const processingTime = Date.now() - processingStartTime;
    if (processingTime > SECURITY_LIMITS.maxProcessingTime) {
      throw new Error("Processamento cancelado por exceder tempo limite.");
    }

    onProgress?.(
      15 + i * progressStep,
      `Redimensionando para ${size}×${size}px...`,
    );

    const canvas = document.createElement("canvas");
    if (size * size * 4 > SECURITY_LIMITS.maxCanvasSize) {
      throw new Error(
        `Tamanho ${size}×${size} muito grande para processamento seguro`,
      );
    }

    canvas.width = size;
    canvas.height = size;
    memoryTracker.add(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Erro ao criar contexto de renderização");
    }

    // Prepare background
    if (!options.backgroundTransparent) {
      ctx.fillStyle = options.backgroundColor || "#000000";
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.clearRect(0, 0, size, size);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Compute draw rect with optional letterbox preserving aspect ratio
    let destW = size;
    let destH = size;
    let dx = 0;
    let dy = 0;
    if (options.preserveAspectRatio) {
      const scale = Math.min(size / img.width, size / img.height);
      destW = Math.max(1, Math.round(img.width * scale));
      destH = Math.max(1, Math.round(img.height * scale));
      dx = Math.floor((size - destW) / 2);
      dy = Math.floor((size - destH) / 2);
    }
    if (size <= 32) {
      let currentCanvas = document.createElement("canvas");
      currentCanvas.width = img.width;
      currentCanvas.height = img.height;
      const currentCtx = currentCanvas.getContext("2d")!;
      currentCtx.imageSmoothingQuality = "high";
      currentCtx.drawImage(img, 0, 0);
      while (
        currentCanvas.width / 2 >= destW &&
        currentCanvas.height / 2 >= destH
      ) {
        const nextCanvas = document.createElement("canvas");
        nextCanvas.width = Math.max(destW, Math.floor(currentCanvas.width / 2));
        nextCanvas.height = Math.max(
          destH,
          Math.floor(currentCanvas.height / 2),
        );
        const nextCtx = nextCanvas.getContext("2d")!;
        nextCtx.imageSmoothingQuality = "high";
        nextCtx.drawImage(
          currentCanvas,
          0,
          0,
          currentCanvas.width,
          currentCanvas.height,
          0,
          0,
          nextCanvas.width,
          nextCanvas.height,
        );
        currentCanvas = nextCanvas;
      }
      ctx.drawImage(
        currentCanvas,
        0,
        0,
        currentCanvas.width,
        currentCanvas.height,
        dx,
        dy,
        destW,
        destH,
      );
    } else {
      const trim = (() => {
        const sampleW = Math.min(img.width, 512);
        const scale = sampleW / img.width;
        const sampleH = Math.max(1, Math.round(img.height * scale));
        const sc = document.createElement("canvas");
        sc.width = sampleW;
        sc.height = sampleH;
        const scx = sc.getContext("2d")!;
        scx.drawImage(img, 0, 0, sampleW, sampleH);
        const d = scx.getImageData(0, 0, sampleW, sampleH).data;
        let minX = sampleW,
          minY = sampleH,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < sampleH; y++)
          for (let x = 0; x < sampleW; x++) {
            const a = d[(y * sampleW + x) * 4 + 3];
            if (a > 8) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        if (maxX < minX || maxY < minY)
          return { sx: 0, sy: 0, sw: img.width, sh: img.height };
        const sx = Math.floor(minX / scale),
          sy = Math.floor(minY / scale);
        const sw = Math.min(
          img.width - sx,
          Math.ceil((maxX - minX + 1) / scale),
        );
        const sh = Math.min(
          img.height - sy,
          Math.ceil((maxY - minY + 1) / scale),
        );
        const shrinkX = 1 - sw / img.width,
          shrinkY = 1 - sh / img.height;
        if (shrinkX < 0.04 && shrinkY < 0.04)
          return { sx: 0, sy: 0, sw: img.width, sh: img.height };
        return { sx, sy, sw, sh };
      })();
      ctx.drawImage(
        img,
        trim.sx,
        trim.sy,
        trim.sw,
        trim.sh,
        dx,
        dy,
        destW,
        destH,
      );
    }

    const imageData: ImageData = ctx.getImageData(0, 0, size, size);
    if (!isSvg && size <= 32) {
      const s = size <= 16 ? 0.28 : 0.2;
      applySharpen(imageData, s);
    }

    memoryTracker.add(imageData);
    resizedImages.push({ size, imageData });
  }

  onProgress?.(85, "Gerando arquivo ICO...");

  const pngs = await Promise.all(
    resizedImages.map(async ({ size, imageData }) => {
      const blob = await imageDataToBlob(imageData, 1.0);
      return {
        buffer: await blob.arrayBuffer(),
        size,
      };
    }),
  );

  const icoBuffer = await withTimeout(
    () => Promise.resolve(createIcoFile(pngs)),
    15000,
    "Timeout: Geração do arquivo ICO demorou muito tempo",
  );

  const icoBlob = new Blob([icoBuffer], { type: "image/x-icon" });

  memoryTracker.add(icoBlob);

  return {
    icoBlob,
    resolutions: resizedImages.map(({ size, imageData }) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      const dataUrl = canvas.toDataURL("image/png");

      return {
        size,
        canvas,
        dataUrl,
      };
    }),
    fileSize: icoBlob.size,
  };
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (
      ![
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
        "image/webp",
        "image/gif",
        "image/avif",
        "image/apng",
        "image/bmp",
        "image/x-icon",
        "image/vnd.microsoft.icon",
      ].includes(file.type)
    ) {
      reject(new Error("Tipo de arquivo não suportado"));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(url);
      img.src = "";
      reject(new Error("Timeout: Carregamento da imagem demorou muito tempo"));
    }, 30000);

    img.onload = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);

      // Para SVG, ignorar validação de width/height (renderização é vetorial)
      if (file.type !== "image/svg+xml") {
        if (img.width === 0 || img.height === 0) {
          reject(new Error("Dimensões da imagem inválidas"));
          return;
        }
        if (img.width > 4096 || img.height > 4096) {
          reject(
            new Error(
              "Imagem muito grande. Use uma imagem menor que 4096×4096 pixels.",
            ),
          );
          return;
        }
      }

      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      reject(
        new Error("Erro ao carregar imagem. Arquivo pode estar corrompido."),
      );
    };

    img.crossOrigin = "anonymous";
    img.src = url;
  });
};

export const generateIcoFromImage = processImageSecurely;

export const downloadIcoFile = (
  icoBlob: Blob,
  filename: string = "icon.ico",
) => {
  const url = URL.createObjectURL(icoBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
};

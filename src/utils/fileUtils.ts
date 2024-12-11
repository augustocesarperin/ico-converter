export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getImageDimensions = (
  url: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
};

export const getSvgDimensions = async (
  file: File,
): Promise<{ width: number; height: number }> => {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) {
    return { width: 0, height: 0 };
  }
  const rawWidth = svg.getAttribute("width") || "";
  const rawHeight = svg.getAttribute("height") || "";
  const viewBox =
    svg.getAttribute("viewBox") || svg.getAttribute("viewbox") || "";

  const parseSize = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  let width = parseSize(rawWidth);
  let height = parseSize(rawHeight);

  if ((!width || !height) && viewBox) {
    const parts = viewBox.split(/\s+/).map((v) => parseFloat(v));
    if (parts.length === 4 && !parts.some(isNaN)) {
      const [, , w, h] = parts as [number, number, number, number];
      width = width || w;
      height = height || h;
    }
  }

  if (!width || !height) {
    // Fallback razoável para preview quando SVG não define dimensões
    return { width: 1024, height: 1024 };
  }

  return { width, height };
};

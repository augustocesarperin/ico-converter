export interface CanvasLikeContext2D {
  getImageData: (sx: number, sy: number, sw: number, sh: number) => {
    data: Uint8ClampedArray;
  };
}

export interface CanvasLikeElement {
  getContext: (contextId: "2d") => CanvasLikeContext2D | null;
}

export interface SmallIconResolution {
  size: number;
  canvas: CanvasLikeElement;
}

/**
 * Analyze small icon coverage to hint whether the result tends to look too thin or too bold.
 * - Returns "thin" if opaque coverage < 28%
 * - Returns "bold" if opaque coverage > 70%
 * - Otherwise returns null
 *
 * Prefers 16px sample; falls back to 32px if 16px isn't available.
 */
export function computeSmallIconHint(
  resolutions: SmallIconResolution[],
): "thin" | "bold" | null {
  const candidate =
    resolutions.find((r) => r.size === 16) || resolutions.find((r) => r.size === 32);
  if (!candidate) return null;

  try {
    const ctx = candidate.canvas.getContext("2d");
    if (!ctx) return null;
    const { data } = ctx.getImageData(0, 0, candidate.size, candidate.size);
    let solidPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 190) solidPixels++;
    }
    const coverage = solidPixels / (candidate.size * candidate.size);
    if (coverage < 0.28) return "thin";
    if (coverage > 0.7) return "bold";
    return null;
  } catch {
    return null;
  }
}








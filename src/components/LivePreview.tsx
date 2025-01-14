import { motion } from "framer-motion";
import { Eye, Settings, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversionConfig } from "./ConversionSettings";

interface LivePreviewProps {
  file: File | null;
  config: ConversionConfig;
  onPreviewReady?: (previewUrl: string) => void;
}

const LivePreview = ({ file, config, onPreviewReady }: LivePreviewProps) => {
  const { t } = useTranslation();
  const [previewsBySize, setPreviewsBySize] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    const generatePreview = async () => {
      setIsGenerating(true);
      try {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Carregar imagem de origem
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = async () => {
          // Funções auxiliares (versões leves do worker)
          const alphaQuantize = (imageData: ImageData, th = 60) => {
            const d = imageData.data;
            for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] > th ? 255 : 0;
            return imageData;
          };
          const coverageRatio = (imageData: ImageData) => {
            const d = imageData.data; let solid = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 190) solid++;
            return solid / (imageData.width * imageData.height);
          };
          const meanLuminance = (imageData: ImageData) => {
            const d = imageData.data; let sum = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (a > 40) { sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; } }
            return n ? sum / n : 128;
          };
          const dilateAlphaNeutral = (imageData: ImageData) => {
            const w = imageData.width, h = imageData.height, d = imageData.data;
            const out = new Uint8ClampedArray(d);
            const luminance = (r:number,g:number,b:number)=> 0.299*r + 0.587*g + 0.114*b;
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const off = (y * w + x) * 4;
                if (d[off + 3] > 0) continue;
                let found = -1;
                for (let cy = -1; cy <= 1; cy++) {
                  const yy = y + cy; if (yy < 0 || yy >= h) continue;
                  for (let cx = -1; cx <= 1; cx++) {
                    const xx = x + cx; if (xx < 0 || xx >= w) continue;
                    const o = (yy * w + xx) * 4;
                    if (d[o + 3] > 150) { found = o; break; }
                  }
                  if (found >= 0) break;
                }
                if (found >= 0) { const lum = luminance(d[found], d[found+1], d[found+2])|0; out[off]=lum; out[off+1]=lum; out[off+2]=lum; out[off + 3] = Math.max(out[off + 3], 210); }
              }
            }
            imageData.data.set(out); return imageData;
          };
          const luminanceSharpen = (imageData: ImageData, amount: number, threshold = 6, contrast = 1.0) => {
            const w = imageData.width, h = imageData.height, src = imageData.data;
            const lum = new Float32Array(w * h), out = new Float32Array(w * h);
            for (let i = 0, p = 0; i < src.length; i += 4, p++) lum[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
            const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                let acc = 0; const idx = y * w + x;
                for (let cy = -1; cy <= 1; cy++) {
                  const yy = Math.min(h - 1, Math.max(0, y + cy));
                  for (let cx = -1; cx <= 1; cx++) {
                    const xx = Math.min(w - 1, Math.max(0, x + cx));
                    acc += lum[yy * w + xx] * k[(cy + 1) * 3 + (cx + 1)];
                  }
                }
                out[idx] = acc;
              }
            }
            for (let i = 0, p = 0; i < src.length; i += 4, p++) {
              const delta = out[p] - lum[p]; if (Math.abs(delta) < threshold) continue;
              const adj = amount * delta;
              src[i] = Math.max(0, Math.min(255, (src[i] - 128) * contrast + 128 + adj));
              src[i + 1] = Math.max(0, Math.min(255, (src[i + 1] - 128) * contrast + 128 + adj));
              src[i + 2] = Math.max(0, Math.min(255, (src[i + 2] - 128) * contrast + 128 + adj));
            }
            return imageData;
          };
          const addOutline = (imageData: ImageData, rgba: [number, number, number, number]) => {
            const w = imageData.width, h = imageData.height, src = imageData.data; const dst = new Uint8ClampedArray(src);
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const off = (y * w + x) * 4; const a = src[off + 3]; if (a > 0) continue; let near = false;
                for (let cy = -1; cy <= 1 && !near; cy++) { const yy = y + cy; if (yy < 0 || yy >= h) continue; for (let cx = -1; cx <= 1; cx++) { const xx = x + cx; if (xx < 0 || xx >= w) continue; if (src[(yy * w + xx) * 4 + 3] > 120) { near = true; break; } } }
                if (near) { dst[off] = rgba[0]; dst[off + 1] = rgba[1]; dst[off + 2] = rgba[2]; dst[off + 3] = Math.max(dst[off + 3], rgba[3]); }
              }
            }
            imageData.data.set(dst); return imageData;
          };
          const drawSizePreview = (size: number): string => {
            canvas.width = size; canvas.height = size; ctx.clearRect(0, 0, size, size);
            if (!config.backgroundTransparent) { ctx.fillStyle = config.backgroundColor || "#000000"; ctx.fillRect(0, 0, size, size); }
            let destW = size, destH = size, dx = 0, dy = 0;
            if (config.preserveAspectRatio) {
              const scale = Math.min(size / img.width, size / img.height);
              destW = Math.max(1, Math.round(img.width * scale));
              destH = Math.max(1, Math.round(img.height * scale));
              dx = Math.floor((size - destW) / 2); dy = Math.floor((size - destH) / 2);
            }
            ctx.imageSmoothingEnabled = true; ctx.drawImage(img, dx, dy, destW, destH);
            if (size <= 32) {
              let data = ctx.getImageData(0, 0, size, size);
              if (size <= 16) data = alphaQuantize(data, 48);
              const auto = config.autoProfile ?? true;
              let strength = Math.max(0, Math.min(2, config.smallIconStrength16 ?? 1.0));
              let useSmall = config.smallIconMode === true;
              if (auto && size <= 16) {
                const cov = coverageRatio(data);
                if (cov < 0.18) { strength = 1.3; useSmall = true; }
                else if (cov > 0.70) { strength = 0.6; useSmall = false; }
                else { strength = 1.0; }
              }
              if (useSmall && size <= 16) {
                for (let k = 0; k < Math.round(strength); k++) data = dilateAlphaNeutral(data);
              } else if (size <= 16) {
                const covThin = coverageRatio(data); if (covThin < 0.30) data = dilateAlphaNeutral(data);
              }
              let sharpen = 0.22; let contrast = 1.06;
              const isSharpPreset = (config.outline16px === true) && !(config.smallIconMode === true) && (config.autoProfile === false);
              const isSoftPreset = (config.smallIconMode === true) && (config.outline16px !== true) && (config.autoProfile === false);
              if (size <= 16) { sharpen = Math.max(0.15, Math.min(0.23, 0.15 + 0.04 * strength)); contrast = 0.97; }
              else if (size === 32) { sharpen = isSharpPreset ? 0.18 : 0.14; contrast = 1.0; }
              data = luminanceSharpen(data, sharpen, size <= 16 ? 3 : 6, contrast);
              if (size <= 16) {
                const avg = meanLuminance(data);
                const pref = config.outline16px;
                const should = typeof pref === 'boolean' ? pref : (auto && avg >= 85 && avg <= 170);
                if (should) { const outline = avg < 128 ? [255, 255, 255, 100] : [0, 0, 0, 100] as [number, number, number, number]; addOutline(data, outline); }
              }
              ctx.putImageData(data, 0, 0);
            }
            return canvas.toDataURL("image/png");
          };

          const entries = config.selectedSizes.map((s) => [s, drawSizePreview(s)] as const);
          const map: Record<number, string> = {};
          for (const [s, urlS] of entries) map[s] = urlS;
          setPreviewsBySize(map);
          onPreviewReady?.(map[256] ?? Object.values(map)[0]);
          URL.revokeObjectURL(url);
          setIsGenerating(false);
        };

        img.onerror = () => { setIsGenerating(false); URL.revokeObjectURL(url); };
        img.src = url;
      } catch (error) {
        setIsGenerating(false);
        console.error("Erro ao gerar preview:", error);
      }
    };

    generatePreview();
  }, [file, config, onPreviewReady]);

  if (!file) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card className="border-orange-500/20 bg-black/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-orange-500" />
            {t("preview.live.title", { defaultValue: "Preview em Tempo Real" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm">
                  {t("preview.live.generating", { defaultValue: "Gerando preview..." })}
                </span>
              </div>
            </div>
          ) : Object.keys(previewsBySize).length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {config.selectedSizes.map((size) => (
                <div
                  key={size}
                  className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/20 p-3 transition-all hover:border-orange-500/30"
                >
                  <div className="aspect-square overflow-hidden rounded border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex h-full items-center justify-center p-2">
                      <img
                        src={previewsBySize[size]}
                        alt={t("preview.details.size", { defaultValue: "Size" }) + ` ${size}x${size}`}
                        className={`max-h-full max-w-full transition-transform duration-300 group-hover:scale-110 ${
                          size <= 32 ? "image-render-pixelated" : ""
                        }`}
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          imageRendering: size <= 32 ? "pixelated" : "auto",
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-white">
                      {size}×{size}px
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getUsageLabel(size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <span className="text-sm">
                {t("preview.live.no_preview", { defaultValue: "Nenhum preview disponível" })}
              </span>
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>
                {t("preview.live.config_summary", {
                  defaultValue: "Configurações aplicadas:",
                })}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.preserveAspectRatio && (
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                  {t("preview.live.preserve_ratio", { defaultValue: "Proporção" })}
                </span>
              )}
              {config.backgroundTransparent ? (
                <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
                  {t("preview.live.transparent", { defaultValue: "Transparente" })}
                </span>
              ) : (
                <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                  {t("preview.live.background", { defaultValue: "Fundo sólido" })}
                </span>
              )}
              {config.crispSmallIcons && (
                <span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs text-orange-400">
                  {t("preview.live.crisp", { defaultValue: "Nítido" })}
                </span>
              )}
              {config.smallIconMode && (
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-400">
                  {t("preview.live.thick", { defaultValue: "Engrossado" })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Canvas oculto para processamento */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={256}
        height={256}
      />
    </motion.div>
  );
};

const getUsageLabel = (size: number): string => {
  switch (size) {
    case 16:
      return "Favicon";
    case 32:
      return "Desktop";
    case 48:
      return "Windows";
    case 64:
      return "Mobile";
    case 128:
      return "App Store";
    case 256:
      return "High DPI";
    default:
      return "Custom";
  }
};

export default LivePreview;




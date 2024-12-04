import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

import AboutSection from "@/components/AboutSection";
import AnimatedBackground from "@/components/AnimatedBackground";
import ConversionSettings, {
  ConversionConfig,
} from "@/components/ConversionSettings";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LivePreview from "@/components/LivePreview";
const PreviewSection = lazy(() => import("@/components/PreviewSection"));
const CodeGenerator = lazy(() => import("@/components/CodeGenerator"));
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";
import {
  generateFaviconPackage,
  FaviconPackage as FaviconPackageType,
} from "@/utils/faviconGenerator";
import { getImageDimensions, getSvgDimensions } from "@/utils/fileUtils";
import { generateIcoFromImage, GeneratedIco } from "@/utils/icoGenerator";
import { processWithWorker } from "@/utils/icoWorkerClient";
import { sanitizeSvgFile } from "@/utils/svgSanitize";

export interface FaviconPackage extends FaviconPackageType {
  zipBlob?: Blob;
  windowsZipBlob?: Blob;
  filename: string;
}

export interface ProcessedImage extends GeneratedIco {
  originalFile: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  faviconPackage?: FaviconPackage;
}

const Index = () => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [processingError, setProcessingError] = useState<string>("");
  const STORAGE_KEY = "icosmith:conversion:v1";
  const [conversionConfig, setConversionConfig] = useState<ConversionConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ConversionConfig;
    } catch {
      /* noop */
    }
    return {
      selectedSizes: [16, 32, 48, 64, 128, 256],
      quality: 0.95,
      filename: "favicon",
      generateFaviconPackage: true,
      includePNG: true,
      includeWebP: false,
      preserveAspectRatio: true,
      backgroundTransparent: true,
      backgroundColor: "#000000",
      crispSmallIcons: true,
      smallIconMode: false,
      smallIconStrength16: 1.2,
      windowsAssets: false,
      windowsProfile: "recommended",
      outline16px: false,
      autoProfile: true,
    } as ConversionConfig;
  });
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [smallIconHint, setSmallIconHint] = useState<"thin" | "bold" | null>(null);
  const [autoSoftApplied, setAutoSoftApplied] = useState(false);
  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversionConfig));
    } catch {
      /* noop */
    }
  }, [conversionConfig]);

  const computeSmallIconHint = (resolutions: { size: number; canvas: HTMLCanvasElement }[]) => {
    const candidate = resolutions.find((r) => r.size === 16) || resolutions.find((r) => r.size === 32);
    if (!candidate) return null;
    try {
      const ctx = candidate.canvas.getContext("2d");
      if (!ctx) return null;
      const data = ctx.getImageData(0, 0, candidate.size, candidate.size).data;
      let solid = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 190) solid++;
      }
      const coverage = solid / (candidate.size * candidate.size);
      if (coverage < 0.28) return "thin";
      if (coverage > 0.70) return "bold";
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (processedImage && resultsRef.current) {
      setTimeout(() => {
        const el = resultsRef.current!;
        const headerOffset = 140; // fixed header + breathing space
        const y =
          el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }, 200);
    }
  }, [processedImage]);

  const handleImageUpload = async (file: File) => {
    if (import.meta.env.DEV)
      console.log("Starting conversion with config:", conversionConfig);
    // Suggest preset based on image size / previous choice
    try {
      const { width: iw, height: ih } =
        file.type === 'image/svg+xml'
          ? await getSvgDimensions(file)
          : await getImageDimensions(URL.createObjectURL(file));
      const maxSide = Math.max(iw, ih);
      const lastWasWindows = (localStorage.getItem('icosmith:lastPreset') || '') === 'windows';
      if (maxSide >= 512) {
        toast({
          title: t('tips.preset_recommend.title', { defaultValue: 'Recomendado: PWA' }),
          description: t('tips.preset_recommend.desc', { defaultValue: 'Imagem grande detectada. Deseja aplicar o preset PWA (192/512 + manifest)?' }),
        });
      } else if (lastWasWindows) {
        toast({
          title: t('tips.preset_recommend.title_win', { defaultValue: 'Recomendado: Windows' }),
          description: t('tips.preset_recommend.desc_win', { defaultValue: 'Você usou Windows/Electron recentemente. Deseja manter este preset?' }),
        });
      }
    } catch {
      /* noop */
    }
    setIsProcessing(true);
    trackEvent("start_conversion", { filename: file.name });
    setProgress(0);
    setCurrentStep(t("processing.starting"));
    setProcessingError("");

    try {
      const sanitizedFile =
        file.type === "image/svg+xml"
          ? new File([await sanitizeSvgFile(file)], file.name, {
              type: "image/svg+xml",
            })
          : file;
      const originalUrl = URL.createObjectURL(sanitizedFile);
      const { width, height } =
        sanitizedFile.type === "image/svg+xml"
          ? await getSvgDimensions(sanitizedFile)
          : await getImageDimensions(originalUrl);

      const canUseWorker =
        typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
      let generatedIco: GeneratedIco;
      if (canUseWorker) {
        setCurrentStep(t("processing.processing_worker"));
        const { icoBlob, pngs } = await processWithWorker({
          file: sanitizedFile,
          sizes: conversionConfig.selectedSizes,
          options: {
            preserveAspectRatio: conversionConfig.preserveAspectRatio,
            backgroundTransparent: conversionConfig.backgroundTransparent,
            backgroundColor: conversionConfig.backgroundColor,
            crispSmallIcons: conversionConfig.crispSmallIcons,
            smallIconMode: conversionConfig.smallIconMode,
            smallIconStrength16: conversionConfig.smallIconStrength16,
            outline16px: conversionConfig.outline16px,
            autoProfile: conversionConfig.autoProfile,
          },
          onProgress: (p, s) => {
            setProgress(p);
            setCurrentStep(s);
          },
        });
        const resolutions = await Promise.all(
          pngs.map(async (p) => {
            const canvas = document.createElement("canvas");
            canvas.width = p.size;
            canvas.height = p.size;
            const ctx = canvas.getContext("2d")!;
            try {
              const bitmap = await createImageBitmap(p.blob);
              ctx.drawImage(bitmap, 0, 0);
            } catch {
              await new Promise<void>((resolve, reject) => {
                const url = URL.createObjectURL(p.blob);
                const img = new Image();
                img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                  URL.revokeObjectURL(url);
                  resolve();
                };
                img.onerror = (e) => {
                  URL.revokeObjectURL(url);
                  reject(e);
                };
                img.src = url;
              });
            }
            const dataUrl = canvas.toDataURL("image/png");
            return { size: p.size, canvas, dataUrl };
          }),
        );
        generatedIco = { icoBlob, resolutions, fileSize: icoBlob.size };
      } else {
        generatedIco = await generateIcoFromImage(
          sanitizedFile,
          conversionConfig.selectedSizes,
          (progress: number, currentStep: string) => {
            setProgress(progress);
            setCurrentStep(currentStep);
          },
          {
            preserveAspectRatio: conversionConfig.preserveAspectRatio,
            backgroundTransparent: conversionConfig.backgroundTransparent,
            backgroundColor: conversionConfig.backgroundColor,
          },
        );
      }

      if (import.meta.env.DEV) {
        console.log("ICO generation completed:", {
          fileSize: generatedIco.fileSize,
          resolutions: generatedIco.resolutions.length,
        });
      }

      let faviconPackage: FaviconPackage | undefined;
      if (
        conversionConfig.generateFaviconPackage ||
        conversionConfig.includePNG ||
        conversionConfig.includeWebP
      ) {
        setCurrentStep(t("processing.generating_package"));
        setProgress(95);

        faviconPackage = await generateFaviconPackage(
          file,
          generatedIco.icoBlob,
          generatedIco.resolutions,
          conversionConfig,
        );
      }

      const processed: ProcessedImage = {
        originalFile: file,
        originalUrl,
        originalWidth: width,
        originalHeight: height,
        faviconPackage,
        ...generatedIco,
      };

      setProcessedImage(processed);
      if (conversionConfig.autoProfile) {
        const hint = computeSmallIconHint(generatedIco.resolutions);
        setSmallIconHint(hint);
        // Auto fallback para pipeline suave quando parecer "fino"
        if (!autoSoftApplied && hint === "thin") {
          const next = {
            ...conversionConfig,
            autoProfile: false,
            crispSmallIcons: true,
            smallIconMode: true,
            outline16px: false,
            smallIconStrength16: 0.6,
          } as ConversionConfig;
          setAutoSoftApplied(true);
          setConversionConfig(next);
          // reprocessa automaticamente com o mesmo arquivo
          void handleImageUpload(processed.originalFile);
          return;
        }
      } else {
        setSmallIconHint(null);
      }
      trackEvent("finish_conversion", {
        resolutions: generatedIco.resolutions.length,
        hasPackage: Boolean(faviconPackage),
      });

      const packageInfo = faviconPackage
        ? t("processing.package_info", {
            count: faviconPackage.files.length - 1,
          })
        : "";
      toast({
        title: t("processing.success_toast_title"),
        description: t("processing.success_toast_description", {
          count: generatedIco.resolutions.length,
          packageInfo,
        }),
      });
    } catch (error) {
      console.error("Error generating ICO:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("processing.unknown_error");
      setProcessingError(errorMessage);
      trackEvent("error_conversion", { message: errorMessage });

      toast({
        title: t("processing.error_toast_title"),
        description: t("processing.error_toast_description"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (import.meta.env.DEV) console.log("Resetting application state");
    if (processedImage?.originalUrl) {
      URL.revokeObjectURL(processedImage.originalUrl);
    }
    setProcessedImage(null);
    setProgress(0);
    setCurrentStep("");
    setProcessingError("");
    setSmallIconHint(null);
    setAutoSoftApplied(false);
    // Dar tempo para o usuário ajustar as configurações: rolar até as opções avançadas
    setTimeout(() => {
      const adv = document.getElementById("advanced-options");
      if (adv) {
        const headerOffset = 140;
        const y =
          adv.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }, 150);
  };

  

  return (
    <div className="flex min-h-screen flex-col">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex-grow pt-20">
          <HeroSection
            onImageUpload={handleImageUpload}
            onFileSelect={setSelectedFile}
            isProcessing={isProcessing}
            onReset={handleReset}
            hasProcessedImage={!!processedImage}
            progress={progress}
            currentStep={currentStep}
            processingError={processingError}
          />

          <div className="w-full">
            <AnimatePresence mode="wait">
              {!isProcessing && !processedImage && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="container mx-auto px-4 pb-16 md:pb-24"
                >
                  <div className="mx-auto max-w-2xl">
                    

                    <div className="mt-6">
                      <ConversionSettings
                        currentSettings={conversionConfig}
                        onSettingsChange={setConversionConfig}
                      />
                    </div>
                    
                    {/* Live Preview */}
                    <div className="mt-8">
                      <LivePreview
                        file={selectedFile}
                        config={conversionConfig}
                        onPreviewReady={(previewUrl) => {
                          // Preview está pronto
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {processedImage && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="container mx-auto space-y-8 px-4 py-8"
                  ref={resultsRef}
                  style={{ contentVisibility: 'auto' }}
                >
                  {smallIconHint && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-4 text-yellow-200">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm">
                          {smallIconHint === "thin"
                            ? t("hints.small_icons.thin", { defaultValue: "No 16/32px pareceu fino. Experimente o perfil Nítido." })
                            : t("hints.small_icons.bold", { defaultValue: "No 16/32px pareceu pesado. Experimente o perfil Suave." })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="rounded bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700"
                            onClick={() => {
                              if (!processedImage) return;
                              const next = {
                                ...conversionConfig,
                                autoProfile: false,
                                crispSmallIcons: true,
                                smallIconMode: true,
                                outline16px: true,
                                smallIconStrength16: 1.2,
                              };
                              setConversionConfig(next);
                              void handleImageUpload(processedImage.originalFile);
                            }}
                            aria-label={t("hints.buttons.try_sharp", { defaultValue: "Usar perfil Nítido" })}
                            title={t("hints.buttons.try_sharp", { defaultValue: "Usar perfil Nítido" })}
                          >
                            {t("hints.buttons.try_sharp", { defaultValue: "Usar perfil Nítido" })}
                          </button>
                          <button
                            className="rounded border border-white/20 bg-black/40 px-3 py-2 text-xs font-medium text-white hover:bg-black/60"
                            onClick={() => {
                              if (!processedImage) return;
                              const next = {
                                ...conversionConfig,
                                autoProfile: false,
                                crispSmallIcons: true,
                                smallIconMode: true,
                                outline16px: false,
                                smallIconStrength16: 0.6,
                              };
                              setConversionConfig(next);
                              void handleImageUpload(processedImage.originalFile);
                            }}
                            aria-label={t("hints.buttons.try_soft", { defaultValue: "Usar perfil Suave" })}
                            title={t("hints.buttons.try_soft", { defaultValue: "Usar perfil Suave" })}
                          >
                            {t("hints.buttons.try_soft", { defaultValue: "Usar perfil Suave" })}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pós-resultado: CTA para ajustes e nova tentativa */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-foreground/90">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm">
                        {t("hints.post_result.not_satisfied", { defaultValue: "Não ficou como você queria? Ajuste as configurações e tente novamente." })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15"
                          onClick={() => {
                            handleReset();
                            trackEvent("open_settings_after_result");
                          }}
                        >
                          {t("hints.post_result.open_settings", { defaultValue: "Ajustar configurações" })}
                        </button>
                        <button
                          className="rounded border border-white/20 bg-black/40 px-3 py-2 text-xs font-medium text-white hover:bg-black/60"
                          onClick={() => {
                            if (!processedImage) return;
                            trackEvent("retry_conversion");
                            void handleImageUpload(processedImage.originalFile);
                          }}
                        >
                          {t("hints.post_result.retry", { defaultValue: "Tentar novamente" })}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Suspense
                    fallback={
                      <div className="text-center text-sm text-muted-foreground">
                        Loading preview…
                      </div>
                    }
                  >
                    <PreviewSection processedImage={processedImage} />
                    {processedImage.faviconPackage && (
                      <CodeGenerator
                        faviconPackage={processedImage.faviconPackage}
                      />
                    )}
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!processedImage && (
              <motion.div
                key="content-sections"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="container mx-auto space-y-16 px-4 py-16" style={{ contentVisibility: 'auto' }}>
                  <FeaturesSection />
                  <AboutSection />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;

import {
  motion,
  AnimatePresence,
  Variants,
  useReducedMotion,
} from "framer-motion";
import { Upload, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import ProcessingProgress from "./ProcessingProgress";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateImageFile, getErrorSuggestion } from "@/utils/fileValidation";

interface HeroSectionProps {
  onImageUpload: (file: File) => void;
  onFileSelect?: (file: File | null) => void;
  isProcessing: boolean;
  onReset: () => void;
  hasProcessedImage: boolean;
  progress?: number;
  currentStep?: string;
  processingError?: string;
}

const HeroSection = ({
  onImageUpload,
  onFileSelect,
  isProcessing,
  onReset,
  hasProcessedImage,
  progress = 0,
  currentStep = "",
  processingError,
}: HeroSectionProps) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [_dragDepth, setDragDepth] = useState(0);
  const [validationError, setValidationError] = useState<string>("");
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [errorType, setErrorType] = useState<string>("");
  const [isRetryable, setIsRetryable] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [acceptString, setAcceptString] = useState<string>(
    "image/png,image/jpeg,image/jpg,image/svg+xml,image/gif,image/apng,image/bmp,image/x-icon,image/vnd.microsoft.icon",
  );
  useEffect(() => {
    (async () => {
      const { buildAcceptString } = await import("@/utils/formatSupport");
      try {
        setAcceptString(await buildAcceptString());
      } catch {
        // Fallback to default accept string if format detection fails
      }
    })();
  }, []);

  const validateAndUpload = async (file: File, isRetry = false) => {
    if (!isRetry) {
      setValidationError("");
      setValidationWarnings([]);
      setErrorType("");
      setIsRetryable(false);
      setLastFile(file);
      onFileSelect?.(file);
      try {
        const url = URL.createObjectURL(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
      } catch {
        // Failed to create preview URL
      }
    }

    if (isRetry) {
      setIsRetrying(true);
    }

    try {
      const validation = await validateImageFile(file, {
        enableRetry: true,
        maxRetries: 3,
        t,
      });

      if (!validation.isValid) {
        setValidationError(
          validation.error || t("hero.errors.validation.invalid_file"),
        );
        setErrorType("UNKNOWN");
        setIsRetryable(true);
        return;
      }

      if (validation.warnings) {
        setValidationWarnings(validation.warnings);
      }

      setValidationError("");
      setErrorType("");
      setIsRetryable(false);

      onImageUpload(file);
    } catch (error) {
      console.error("Validation error:", error);
      setValidationError(t("hero.errors.validation.unexpected"));
      setErrorType("UNKNOWN");
      setIsRetryable(true);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleRetry = () => {
    if (lastFile && isRetryable) {
      validateAndUpload(lastFile, true);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || isRetrying) return;
    setDragDepth((d) => d + 1);
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || isRetrying) return;
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || isRetrying) return;
    setDragDepth((d) => {
      const next = Math.max(0, d - 1);
      if (next === 0) setIsDragOver(false);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth(0);
    setIsDragOver(false);
    if (isProcessing || isRetrying) return;

    const imageFile = e.dataTransfer.files?.[0];
    if (imageFile) {
      validateAndUpload(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
    e.target.value = "";
  };

  const openFileDialogWithReset = () => {
    if (isProcessing || isRetrying) return;
    if (hasProcessedImage) {
      // Limpa preview local antes de abrir o seletor
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      onReset();
      // Não abre o seletor automaticamente: dá tempo para ajustar configurações
    } else {
      document.getElementById("file-input")?.click();
    }
  };

  const prefersReducedMotion = useReducedMotion();
  const titleContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const letterVariant: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      };

  const titleText = t("hero.title");
  const smithIndex = titleText.indexOf("Smith");
  const sizeChips = [16, 32, 48, 64, 128, 256];

  return (
    <section className="relative flex min-h-[54vh] items-center justify-center overflow-hidden px-4 py-6 sm:min-h-[58vh] sm:py-8 md:py-10 lg:py-12">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-5 text-center sm:space-y-6 md:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <motion.h1
              className="hero-title text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              variants={titleContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {titleText.split("").map((char, index) => (
                <motion.span
                  key={`${char}-${index}`}
                  variants={letterVariant}
                  className={index >= smithIndex ? "text-primary" : ""}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.h1>

            <div className="space-y-0.5">
              <p className="mx-auto max-w-2xl bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/70 bg-clip-text text-xs font-normal text-foreground/70 text-transparent sm:text-sm">
                {t("hero.description")}
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl rounded-xl bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] shadow-[0_0_18px_rgba(249,115,22,0.1)] backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-12px_rgba(249,115,22,0.35)]">
            <motion.div
              className={cn(
                "relative overflow-hidden bg-black/50 rounded-[11px] h-full w-full p-4 sm:p-5 md:p-6 cursor-pointer border-2 border-transparent",
                "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isDragOver && "scale-[1.01] bg-primary/10",
              )}
              role="region"
              aria-label={t("hero.upload.title")}
              tabIndex={0}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialogWithReset}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFileDialogWithReset();
                }
              }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{ willChange: "transform" }}
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[11px] bg-[radial-gradient(120%_60%_at_50%_-20%,rgba(249,115,22,0.18),transparent)]"
                animate={{ opacity: isDragOver ? 1 : 0.35 }}
                transition={{ duration: 0.25 }}
              />
              <input
                id="file-input"
                type="file"
                accept={acceptString}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || hasProcessedImage || isRetrying}
                aria-label={t("hero.upload.aria_label")}
              />
              <AnimatePresence mode="wait">
                {!hasProcessedImage && !isProcessing && (
                  <motion.div
                    key="upload-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.45 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <motion.div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 sm:h-20 sm:w-20"
                      animate={{ scale: isDragOver ? 1.1 : 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 10,
                      }}
                    >
                      <Upload className="h-8 w-8 text-orange-500 sm:h-10 sm:w-10" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                        {t("hero.upload.title")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("hero.upload.subtitle")}
                      </p>
                    </div>

                    {previewUrl && (
                      <div className="mx-auto max-w-[220px]">
                        <div className="bg-checkerboard aspect-square overflow-hidden rounded-lg border border-white/10">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t("hero.upload.preview")}
                        </p>
                      </div>
                    )}

                    <div
                      className="flex flex-wrap justify-center gap-2 pt-2"
                      aria-label="ICO sizes"
                    >
                      {sizeChips.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-foreground/80"
                        >
                          {s}×{s}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {(isProcessing || isRetrying) && (
                  <ProcessingProgress
                    isProcessing={isProcessing || isRetrying}
                    progress={isRetrying ? 0 : progress}
                    currentStep={
                      isRetrying
                        ? t("hero.processing.retrying_step")
                        : currentStep
                    }
                    error={processingError}
                  />
                )}

                {hasProcessedImage && !isProcessing && (
                  <motion.div
                    key="success-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="space-y-4 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 sm:h-20 sm:w-20">
                      <Upload className="h-8 w-8 text-orange-500 sm:h-10 sm:w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                        {t("hero.processing.success_title")}
                      </h3>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        {t("hero.processing.success_subtitle")}
                      </p>
                    </div>
                    <Button
                      onClick={openFileDialogWithReset}
                      variant="default"
                      size="sm"
                      className="mt-4 border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t("hero.processing.reset_button")}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {validationError && !isProcessing && !isRetrying && (
            <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-red-400">
              <div className="flex items-center">
                <AlertTriangle className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">
                    {t("hero.errors.processing.generic_title")}
                  </p>
                  <p className="text-sm">{validationError}</p>
                  <p className="mt-1 text-sm opacity-80">
                    {getErrorSuggestion(errorType, t)}
                  </p>
                </div>
              </div>
              {isRetryable && (
                <Button
                  onClick={handleRetry}
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("hero.processing.retry_button")}
                </Button>
              )}
            </div>
          )}

          {validationWarnings.length > 0 &&
            !validationError &&
            !isProcessing &&
            !isRetrying && (
              <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-4 text-yellow-300">
                <div className="flex items-start">
                  <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold">{t("hero.warnings.title")}:</p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                      {validationWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

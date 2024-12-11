import { TFunction } from "i18next";

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings: string[];
  suggestion?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  enableRetry?: boolean;
  maxRetries?: number;
  processingTimeout?: number;
  t?: TFunction;
}

type ValidationConfig = Omit<FileValidationOptions, "t">;

const DEFAULT_OPTIONS: Required<ValidationConfig> = {
  maxSizeInMB: 50,
  allowedTypes: [
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
  ],
  minDimensions: { width: 16, height: 16 },
  maxDimensions: { width: 4096, height: 4096 },
  enableRetry: true,
  maxRetries: 3,
  processingTimeout: 60000,
};

interface RateLimitState {
  uploadCount: number;
  lastUploadTime: number;
  lastResetTime: number;
}

const rateLimitState: RateLimitState = {
  uploadCount: 0,
  lastUploadTime: 0,
  lastResetTime: Date.now(),
};

const RATE_LIMITS = {
  maxUploadsPerMinute: 10,
  maxUploadsPerHour: 50,
  cooldownPeriod: 60000,
};

const ERROR_MESSAGES = {
  FILE_TYPE: (allowedTypes: string[]) =>
    `Formato não suportado. Use apenas: ${allowedTypes.map((type) => type.split("/")[1].toUpperCase()).join(", ")}`,
  FILE_SIZE: (maxSize: number, currentSize: number) =>
    `Arquivo muito grande (${currentSize.toFixed(1)}MB). Máximo permitido: ${maxSize}MB`,
  DIMENSIONS_TOO_SMALL: (
    minWidth: number,
    minHeight: number,
    currentWidth: number,
    currentHeight: number,
  ) =>
    `Imagem muito pequena (${currentWidth}×${currentHeight}px). Mínimo: ${minWidth}×${minHeight}px`,
  DIMENSIONS_TOO_LARGE: (
    maxWidth: number,
    maxHeight: number,
    currentWidth: number,
    currentHeight: number,
  ) =>
    `Imagem muito grande (${currentWidth}×${currentHeight}px). Máximo: ${maxWidth}×${maxHeight}px para evitar sobrecarga do sistema`,
  CORRUPTED: "Arquivo corrompido ou formato inválido. Tente com outra imagem.",
  NETWORK: "Erro de rede. Verifique sua conexão e tente novamente.",
  UNKNOWN: "Erro inesperado. Tente novamente ou use outro arquivo.",
  RATE_LIMIT:
    "Muitos uploads em pouco tempo. Aguarde um momento antes de tentar novamente.",
  PROCESSING_TIMEOUT:
    "Processamento demorou muito tempo. Tente com uma imagem menor.",
};

const checkRateLimit = (): boolean => {
  const now = Date.now();
  const timeSinceLastReset = now - rateLimitState.lastResetTime;

  if (timeSinceLastReset >= RATE_LIMITS.cooldownPeriod) {
    rateLimitState.uploadCount = 0;
    rateLimitState.lastResetTime = now;
  }

  if (rateLimitState.uploadCount >= RATE_LIMITS.maxUploadsPerMinute) {
    return false;
  }

  const timeSinceLastUpload = now - rateLimitState.lastUploadTime;
  if (timeSinceLastUpload < 1000) {
    return false;
  }

  return true;
};

const getImageDimensionsSecure = (
  file: File,
  timeout: number = 10000,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(url);
      img.src = "";
      reject(new Error("PROCESSING_TIMEOUT"));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      reject(new Error("CORRUPTED"));
    };

    img.crossOrigin = "anonymous";
    img.src = url;
  });
};

export const validateImageFile = async (
  file: File,
  options: FileValidationOptions = {},
): Promise<FileValidationResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { t } = opts;
  const warnings: string[] = [];

  try {
    if (!checkRateLimit()) {
      return {
        isValid: false,
        error: t
          ? t("hero.errors.validation.rate_limit")
          : ERROR_MESSAGES.RATE_LIMIT,
        warnings: [],
      };
    }

    rateLimitState.uploadCount++;
    rateLimitState.lastUploadTime = Date.now();

    if (!opts.allowedTypes.includes(file.type)) {
      const errorMsg = t
        ? t("hero.errors.validation.file_type", {
            allowedTypes: opts.allowedTypes
              .map((type) => type.split("/")[1].toUpperCase())
              .join(", "),
          })
        : ERROR_MESSAGES.FILE_TYPE(opts.allowedTypes);
      return {
        isValid: false,
        error: errorMsg,
        warnings,
        suggestion: getErrorSuggestion("FILE_TYPE", t),
      };
    }

    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > opts.maxSizeInMB) {
      const errorMsg = t
        ? t("hero.errors.validation.file_size", {
            currentSize: fileSizeInMB.toFixed(1),
            maxSize: opts.maxSizeInMB,
          })
        : ERROR_MESSAGES.FILE_SIZE(opts.maxSizeInMB, fileSizeInMB);
      return {
        isValid: false,
        error: errorMsg,
        warnings,
        suggestion: getErrorSuggestion("FILE_SIZE", t),
      };
    }

    let dimensions: { width: number; height: number } | null = null;
    if (file.type !== "image/svg+xml") {
      try {
        dimensions = await getImageDimensionsSecure(
          file,
          opts.processingTimeout,
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "UNKNOWN";
        const errorKey =
          msg === "PROCESSING_TIMEOUT" ? "processing_timeout" : "corrupted";
        const fallbackError =
          msg === "PROCESSING_TIMEOUT"
            ? ERROR_MESSAGES.PROCESSING_TIMEOUT
            : ERROR_MESSAGES.CORRUPTED;
        return {
          isValid: false,
          error: t ? t(`hero.errors.validation.${errorKey}`) : fallbackError,
          warnings,
          suggestion: getErrorSuggestion(msg, t),
        };
      }
    }

    if (
      dimensions &&
      (dimensions.width < opts.minDimensions.width ||
        dimensions.height < opts.minDimensions.height)
    ) {
      const errorMsg = t
        ? t("hero.errors.validation.dimensions_too_small", {
            currentWidth: dimensions.width,
            currentHeight: dimensions.height,
            minWidth: opts.minDimensions.width,
            minHeight: opts.minDimensions.height,
          })
        : ERROR_MESSAGES.DIMENSIONS_TOO_SMALL(
            opts.minDimensions.width,
            opts.minDimensions.height,
            dimensions.width,
            dimensions.height,
          );
      return {
        isValid: false,
        error: errorMsg,
        warnings,
        suggestion: getErrorSuggestion("DIMENSIONS_TOO_SMALL", t),
      };
    }

    if (
      dimensions &&
      (dimensions.width > opts.maxDimensions.width ||
        dimensions.height > opts.maxDimensions.height)
    ) {
      const errorMsg = t
        ? t("hero.errors.validation.dimensions_too_large", {
            currentWidth: dimensions.width,
            currentHeight: dimensions.height,
            maxWidth: opts.maxDimensions.width,
            maxHeight: opts.maxDimensions.height,
          })
        : ERROR_MESSAGES.DIMENSIONS_TOO_LARGE(
            opts.maxDimensions.width,
            opts.maxDimensions.height,
            dimensions.width,
            dimensions.height,
          );
      return {
        isValid: false,
        error: errorMsg,
        warnings,
        suggestion: getErrorSuggestion("DIMENSIONS_TOO_LARGE", t),
      };
    }

    if (file.type === "image/jpeg") {
      // no-op placeholder, keep for future jpeg-specific checks
    }

    return { isValid: true, warnings };
  } catch (err: unknown) {
    console.error("Validation Exception:", err);
    return {
      isValid: false,
      error: t ? t("hero.errors.validation.unknown") : ERROR_MESSAGES.UNKNOWN,
      warnings,
      suggestion: getErrorSuggestion("UNKNOWN", t),
    };
  }
};

export const getErrorSuggestion = (
  errorType: string,
  t?: TFunction,
): string => {
  const suggestionKeyMap: { [key: string]: string } = {
    FILE_TYPE: "file_type",
    FILE_SIZE: "file_size",
    DIMENSIONS_TOO_SMALL: "dimensions_too_small",
    DIMENSIONS_TOO_LARGE: "dimensions_too_large",
    CORRUPTED: "corrupted",
    PROCESSING_TIMEOUT: "dimensions_too_large", // Suggestion is similar
  };

  const key = suggestionKeyMap[errorType];

  if (t && key) {
    return t(`hero.errors.suggestions.${key}`);
  }

  // Fallback for when `t` is not available or key not found
  switch (errorType) {
    case "FILE_TYPE":
      return "Tente converter sua imagem para PNG ou JPG antes de enviar.";
    case "FILE_SIZE":
      return "Redimensione a imagem ou comprima para reduzir o tamanho.";
    case "DIMENSIONS_TOO_SMALL":
      return "Use uma imagem com resolução maior para melhores resultados.";
    case "DIMENSIONS_TOO_LARGE":
    case "PROCESSING_TIMEOUT":
      return "A imagem é muito grande. Redimensione para menos de 4096x4096px.";
    case "CORRUPTED":
      return "O arquivo parece estar danificado. Tente exportá-lo novamente ou usar outro.";
    default:
      return "Tente recarregar a página ou usar um arquivo diferente.";
  }
};

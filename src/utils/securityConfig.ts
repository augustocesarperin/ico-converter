// Security Configuration for IcoSmith

// Environment detection
const isDevelopment = (): boolean => {
  return (
    process.env.NODE_ENV === "development" ||
    import.meta.env?.DEV === true ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

const isProduction = (): boolean => {
  return (
    process.env.NODE_ENV === "production" || import.meta.env?.PROD === true
  );
};

export const SECURITY_CONFIG = {
  // File upload limits
  FILE_LIMITS: {
    maxSizeInMB: isDevelopment() ? 60 : 50, // Increased limits for larger images
    maxDimensions: {
      width: isDevelopment() ? 4096 : 3072, // Higher res in dev
      height: isDevelopment() ? 4096 : 3072,
    },
    minDimensions: { width: 16, height: 16 },
    allowedTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"], // Added WebP
    processingTimeout: 60000, // 60 seconds
    maxFiles: 5,
  },

  // Rate limiting
  RATE_LIMITS: {
    maxUploadsPerMinute: isDevelopment() ? 100 : 30, // Much more generous
    maxUploadsPerHour: isDevelopment() ? 500 : 150, // Higher limits
    minTimeBetweenUploads: isDevelopment() ? 200 : 500, // Faster in dev, reasonable in prod
    cooldownPeriod: 30000, // Reduced to 30 seconds
    warningThreshold: isDevelopment() ? 80 : 20, // Warn before limiting
  },

  // Processing limits
  PROCESSING_LIMITS: {
    maxProcessingTime: isDevelopment() ? 120000 : 60000, // 2min dev, 1min prod
    maxMemoryUsage: isDevelopment() ? 200 : 150, // MB - More memory in dev
    maxConcurrentOperations: isDevelopment() ? 3 : 1, // Parallel processing in dev
    maxCanvasSize: isDevelopment() ? 8192 : 4096, // Larger canvas in dev
    maxRetries: 3,
  },

  // CSP Configuration
  CSP_CONFIG: {
    defaultSrc: "'self'",
    scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval'",
    styleSrc: "'self' 'unsafe-inline' https://fonts.googleapis.com",
    fontSrc: "'self' https://fonts.gstatic.com",
    imgSrc: "'self' data: blob:",
    connectSrc: "'self'",
    frameAncestors: "'none'",
    baseUri: "'self'",
    formAction: "'self'",
    objectSrc: "'none'",
  },

  // Security headers
  SECURITY_HEADERS: {
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "camera=(), microphone=(), geolocation=(), payment=()",
  },

  // Validation patterns
  VALIDATION: {
    // CSS color validation regex
    cssColorRegex:
      /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|[a-zA-Z]+)$/,

    // Dangerous CSS patterns to block
    dangerousCSSPatterns: [
      "javascript:",
      "expression(",
      "url(",
      "@import",
      "<script",
      "eval(",
      "document.",
      "window.",
      "function(",
      "constructor",
      "prototype",
    ],

    // Filename validation
    filenameRegex: /^[a-zA-Z0-9_-]+$/,
    maxFilenameLength: 50,
  },

  // Error messages - More user-friendly and helpful
  ERROR_MESSAGES: {
    RATE_LIMIT:
      "⏱️ Calma aí! Muitos uploads seguidos. Aguarde alguns segundos para tentar novamente.",
    FILE_TOO_LARGE:
      "📏 Sua imagem é um pouco grande demais. Que tal reduzir o tamanho para menos de {maxSize}MB?",
    PROCESSING_TIMEOUT:
      "⏰ Ops! Sua imagem está demorando para processar. Tente com uma imagem menor ou em formato diferente.",
    MEMORY_LIMIT:
      "🧠 Imagem muito complexa para processar. Tente redimensionar para menos de 2048×2048 pixels.",
    CONCURRENT_PROCESSING:
      "⚡ Já estou processando uma imagem. Aguarde terminar para enviar outra!",
    INVALID_DIMENSIONS:
      "📐 Hmm, não consegui ler as dimensões desta imagem. Ela pode estar corrompida.",
    CORRUPTED_FILE:
      "🔧 Este arquivo parece estar com problemas. Tente salvar a imagem novamente ou use outro formato.",
    SECURITY_VIOLATION:
      "🛡️ Por segurança, não posso processar este arquivo. Tente com uma imagem PNG ou JPG normal.",
    FILE_TYPE_FRIENDLY:
      "📁 Este formato não é suportado. Use PNG, JPG ou WebP para melhores resultados!",
    SIZE_SUGGESTION:
      "💡 Dica: Para ícones, imagens entre 256×256 e 1024×1024 pixels funcionam perfeitamente!",
    PERFORMANCE_WARNING:
      "🚀 Imagem grande detectada! O processamento pode demorar um pouquinho mais.",
    QUALITY_TIP:
      "✨ Para melhor qualidade de ícone, use imagens quadradas (mesma largura e altura).",
  },

  // Development vs Production settings
  isDevelopment: () => import.meta.env.MODE === "development",

  // Get current security level
  getSecurityLevel: (): "strict" | "normal" | "permissive" => {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      return "normal";
    }
    return "strict";
  },

  // Apply security level adjustments
  getAdjustedLimits: () => {
    const level = SECURITY_CONFIG.getSecurityLevel();
    const baseLimits = SECURITY_CONFIG.FILE_LIMITS;

    switch (level) {
      case "permissive":
        return {
          ...baseLimits,
          maxSizeInMB: baseLimits.maxSizeInMB * 2,
          processingTimeout: baseLimits.processingTimeout * 2,
        };
      case "strict":
        return {
          ...baseLimits,
          maxSizeInMB: Math.min(baseLimits.maxSizeInMB, 3),
          processingTimeout: Math.min(baseLimits.processingTimeout, 20000),
        };
      default:
        return baseLimits;
    }
  },
};

// Security utility functions
export const SecurityUtils = {
  // Validate CSS color value
  isValidCSSColor: (color: string): boolean => {
    if (!color || typeof color !== "string") return false;

    const lowerColor = color.toLowerCase();
    for (const pattern of SECURITY_CONFIG.VALIDATION.dangerousCSSPatterns) {
      if (lowerColor.includes(pattern)) {
        return false;
      }
    }

    return SECURITY_CONFIG.VALIDATION.cssColorRegex.test(color.trim());
  },

  // Validate filename
  isValidFilename: (filename: string): boolean => {
    if (!filename || typeof filename !== "string") return false;
    if (filename.length > SECURITY_CONFIG.VALIDATION.maxFilenameLength)
      return false;
    return SECURITY_CONFIG.VALIDATION.filenameRegex.test(filename);
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, SECURITY_CONFIG.VALIDATION.maxFilenameLength);
  },

  // Check if operation is safe based on current system resources
  isOperationSafe: (
    estimatedMemoryUsage: number,
    estimatedProcessingTime: number,
  ): boolean => {
    const limits = SECURITY_CONFIG.PROCESSING_LIMITS;

    if (estimatedMemoryUsage > limits.maxMemoryUsage) {
      return false;
    }

    if (estimatedProcessingTime > limits.maxProcessingTime) {
      return false;
    }

    return true;
  },

  // Log security events (in development)
  logSecurityEvent: (event: string, details?: unknown) => {
    if (SECURITY_CONFIG.isDevelopment()) {
      console.warn(`[SECURITY] ${event}`, details);
    }
  },
};

// User Experience Helpers
export const UXHelpers = {
  // Get user-friendly error message with context
  getFriendlyErrorMessage: (
    errorType: string,
    context?: { maxSize?: string; remaining?: number },
  ): string => {
    const messages = SECURITY_CONFIG.ERROR_MESSAGES;

    switch (errorType) {
      case "FILE_TOO_LARGE":
        return messages.FILE_TOO_LARGE.replace(
          "{maxSize}",
          context?.maxSize || "50",
        );
      case "FILE_TYPE":
        return messages.FILE_TYPE_FRIENDLY;
      case "DIMENSIONS_TOO_LARGE":
        return `${messages.MEMORY_LIMIT}\n${messages.SIZE_SUGGESTION}`;
      case "RATE_LIMIT_WARNING":
        return `⚠️ Você está enviando muitas imagens. Mais ${context?.remaining || 5} antes do limite.`;
      default:
        return (
          messages[errorType as keyof typeof messages] ||
          messages.SECURITY_VIOLATION
        );
    }
  },

  // Progressive guidance system
  getProgressiveHelp: (attemptCount: number, lastError?: string): string[] => {
    const tips: string[] = [];

    if (attemptCount === 1) {
      tips.push(
        "💡 Primeira vez? Use imagens PNG ou JPG para melhores resultados!",
      );
    }

    if (attemptCount === 2 && lastError?.includes("grande")) {
      tips.push(
        "🔧 Tente redimensionar sua imagem para 1024×1024 pixels ou menos.",
      );
      tips.push(
        "📱 Você pode usar qualquer editor de imagem ou até mesmo o Paint!",
      );
    }

    if (attemptCount >= 3) {
      tips.push(
        "🆘 Precisa de ajuda? Tente com uma imagem simples primeiro (ex: PNG de 512×512px).",
      );
      tips.push("📧 Se continuar com problemas, pode ser um bug - nos avise!");
    }

    return tips;
  },

  // Smart rate limiting with warnings
  checkRateLimitWithWarning: (): {
    allowed: boolean;
    warning?: string;
    remaining?: number;
  } => {
    const limits = SECURITY_CONFIG.RATE_LIMITS;
    // Implementation would track uploads and provide warnings before blocking
    return { allowed: true }; // Simplified for now
  },

  // Context-aware suggestions
  getSmartSuggestions: (file: File, error?: string): string[] => {
    const suggestions: string[] = [];
    const sizeInMB = file.size / (1024 * 1024);

    if (sizeInMB > 5) {
      suggestions.push(
        "💾 Comprima sua imagem online (TinyPNG, Squoosh.app) para reduzir o tamanho.",
      );
    }

    if (file.type === "image/bmp" || file.type === "image/tiff") {
      suggestions.push(
        "🔄 Converta para PNG ou JPG - formatos mais eficientes e compatíveis.",
      );
    }

    if (error?.includes("timeout")) {
      suggestions.push(
        "⚡ Tente uma imagem menor ou em formato PNG para processamento mais rápido.",
      );
    }

    return suggestions;
  },
};

export default SECURITY_CONFIG;

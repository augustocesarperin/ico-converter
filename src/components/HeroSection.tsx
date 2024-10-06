import { useState, useEffect } from 'react';
import { Upload, X, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ProcessingProgress from './ProcessingProgress';
import { validateImageFile, getErrorSuggestion } from '@/utils/fileValidation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
  onReset: () => void;
  hasProcessedImage: boolean;
  progress?: number;
  currentStep?: string;
  processingError?: string;
}

const HeroSection = ({ 
  onImageUpload, 
  isProcessing, 
  onReset, 
  hasProcessedImage,
  progress = 0,
  currentStep = '',
  processingError
}: HeroSectionProps) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [errorType, setErrorType] = useState<string>('');
  const [isRetryable, setIsRetryable] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [acceptString, setAcceptString] = useState<string>('image/png,image/jpeg,image/jpg,image/svg+xml,image/gif,image/apng,image/bmp,image/x-icon,image/vnd.microsoft.icon');
  useEffect(() => {
    (async () => {
      const { buildAcceptString } = await import('@/utils/formatSupport');
      try { 
        setAcceptString(await buildAcceptString()); 
      } catch {
        // Fallback to default accept string if format detection fails
      }
    })();
  }, []);

  const validateAndUpload = async (file: File, isRetry = false) => {
    if (!isRetry) {
      setValidationError('');
      setValidationWarnings([]);
      setErrorType('');
      setIsRetryable(false);
      setLastFile(file);
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
        setValidationError(validation.error || t('hero.errors.validation.invalid_file'));
        setErrorType('UNKNOWN');
        setIsRetryable(true);
        return;
      }

      if (validation.warnings) {
        setValidationWarnings(validation.warnings);
      }

      setValidationError('');
      setErrorType('');
      setIsRetryable(false);
      
      onImageUpload(file);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError(t('hero.errors.validation.unexpected'));
      setErrorType('UNKNOWN');
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

  const handleDragEvents = (e: React.DragEvent, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing && !isRetrying) setIsDragOver(isOver);
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e, false);
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
    e.target.value = '';
  };


  const titleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const letterVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const titleText = t('hero.title');
  const smithIndex = titleText.indexOf('Smith');
  const sizeChips = [16, 32, 48, 64, 128, 256];

  return (
    <section className="relative flex items-center justify-center py-6 sm:py-8 md:py-12 lg:py-16 px-4 overflow-hidden min-h-[60vh] sm:min-h-[65vh]">
      <div className="container mx-auto max-w-4xl">
        <div 
          className="text-center space-y-6 sm:space-y-8 md:space-y-10"
        >
          <div 
            className="space-y-4 sm:space-y-6"
          >
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter text-white leading-tight"
              variants={titleContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {titleText.split('').map((char, index) => (
                <motion.span 
                  key={`${char}-${index}`}
                  variants={letterVariant}
                  className={index >= smithIndex ? 'text-primary' : ''}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.h1>
            
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-foreground/70 max-w-2xl mx-auto font-normal bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/70 bg-clip-text text-transparent">
                {t('hero.description')}
              </p>
            </div>
            
          </div>

          {(isProcessing || processingError) && (
            <div className="max-w-2xl mx-auto">
              <ProcessingProgress 
                isProcessing={isProcessing}
                progress={progress}
                currentStep={currentStep}
                error={processingError}
              />
            </div>
          )}

          <div
            className="w-full max-w-xl mx-auto bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_36px_-12px_rgba(249,115,22,0.35)] backdrop-blur-sm transition-all duration-300 ease-in-out"
          >
            <div
              className={cn(
                "bg-black/50 rounded-[11px] h-full w-full p-4 sm:p-6 md:p-7 cursor-pointer border-2 border-transparent",
                "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isDragOver && 'scale-[1.02] border-dashed border-primary/40 bg-primary/10'
              )}
              role="region"
              aria-label={t('hero.upload.title')}
              tabIndex={0}
              onDragEnter={(e) => handleDragEvents(e, true)}
              onDragOver={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDrop={handleDrop}
              onClick={() => !hasProcessedImage && document.getElementById('file-input')?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !hasProcessedImage) {
                  e.preventDefault();
                  document.getElementById('file-input')?.click();
                }
              }}
            >
              <input
                id="file-input"
                type="file"
                accept={acceptString}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || hasProcessedImage || isRetrying}
                aria-label={t('hero.upload.aria_label')}
              />
              <AnimatePresence mode="wait">
                {!hasProcessedImage && !isProcessing && (
                  <motion.div
                    key="upload-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <motion.div
                      className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500/10 flex items-center justify-center"
                      animate={{ scale: isDragOver ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    >
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                        {t('hero.upload.title')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('hero.upload.subtitle')}
                      </p>
                    </div>

                    {previewUrl && (
                      <div className="mx-auto max-w-[220px]">
                        <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-checkerboard">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{t('hero.upload.preview')}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-2 pt-2" aria-label="ICO sizes">
                      {sizeChips.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-foreground/80">
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
                    currentStep={isRetrying ? t('hero.processing.retrying_step') : currentStep}
                    error={processingError}
                  />
                )}

                {hasProcessedImage && !isProcessing && (
                  <motion.div
                    key="success-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 text-center"
                  >
                    <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                        {t('hero.processing.success_title')}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {t('hero.processing.success_subtitle')}
                      </p>
                    </div>
                    <Button 
                      onClick={onReset}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t('hero.processing.reset_button')}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {validationError && !isProcessing && !isRetrying && (
            <div
              className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 max-w-2xl mx-auto"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">{t('hero.errors.processing.generic_title')}</p>
                  <p className="text-sm">{validationError}</p>
                  <p className="text-sm mt-1 opacity-80">{getErrorSuggestion(errorType, t)}</p>
                </div>
              </div>
              {isRetryable && (
                <Button onClick={handleRetry} variant="secondary" size="sm" className="mt-3 w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('hero.processing.retry_button')}
                </Button>
              )}
            </div>
          )}

          {validationWarnings.length > 0 && !validationError && !isProcessing && !isRetrying && (
            <div
              className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300 max-w-2xl mx-auto"
            >
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">{t('hero.warnings.title')}:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
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

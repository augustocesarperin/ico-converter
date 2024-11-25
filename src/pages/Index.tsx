import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import AboutSection from '@/components/AboutSection';
import { Suspense, lazy } from 'react';
const PreviewSection = lazy(() => import('@/components/PreviewSection'));
const CodeGenerator = lazy(() => import('@/components/CodeGenerator'));
import ConversionSettings, { ConversionConfig } from '@/components/ConversionSettings';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { generateIcoFromImage, GeneratedIco, IcoGenerationProgress } from '@/utils/icoGenerator';
import { processWithWorker } from '@/utils/icoWorkerClient';
import { generateFaviconPackage, FaviconPackage as FaviconPackageType } from '@/utils/faviconGenerator';
import { getImageDimensions, getSvgDimensions } from '@/utils/fileUtils';
import { sanitizeSvgFile } from '@/utils/svgSanitize';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTranslation } from 'react-i18next';

export interface FaviconPackage extends FaviconPackageType {
  zipBlob?: Blob;
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
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [processingError, setProcessingError] = useState<string>('');
  const [conversionConfig, setConversionConfig] = useState<ConversionConfig>({
    selectedSizes: [16, 32, 48, 64, 128, 256],
    quality: 0.95,
    filename: 'favicon',
    generateFaviconPackage: true,
    includePNG: true,
    includeWebP: false,
    preserveAspectRatio: true,
    backgroundTransparent: true,
    backgroundColor: '#000000',
    crispSmallIcons: true,
    smallIconMode: false
    , smallIconStrength16: 1.2
  });
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (processedImage && resultsRef.current) {
      setTimeout(() => {
        const el = resultsRef.current!;
        const headerOffset = 140; // fixed header + breathing space
        const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }, 200);
    }
  }, [processedImage]);

  const handleImageUpload = async (file: File) => {
    if (import.meta.env.DEV) console.log('Starting conversion with config:', conversionConfig);
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep(t('processing.starting'));
    setProcessingError('');

    try {
      const sanitizedFile = file.type === 'image/svg+xml' ? new File([await sanitizeSvgFile(file)], file.name, { type: 'image/svg+xml' }) : file;
      const originalUrl = URL.createObjectURL(sanitizedFile);
      const { width, height } = sanitizedFile.type === 'image/svg+xml'
        ? await getSvgDimensions(sanitizedFile)
        : await getImageDimensions(originalUrl);
      
      const canUseWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
      let generatedIco: GeneratedIco;
      if (canUseWorker) {
        setCurrentStep(t('processing.processing_worker'));
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
          },
          onProgress: (p, s) => { setProgress(p); setCurrentStep(s); },
        });
        const resolutions = await Promise.all(pngs.map(async (p) => {
          const canvas = document.createElement('canvas');
          canvas.width = p.size; canvas.height = p.size;
          const ctx = canvas.getContext('2d')!;
          try {
            const bitmap = await createImageBitmap(p.blob);
            ctx.drawImage(bitmap, 0, 0);
          } catch {
            await new Promise<void>((resolve, reject) => {
              const url = URL.createObjectURL(p.blob);
              const img = new Image();
              img.onload = () => { ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url); resolve(); };
              img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
              img.src = url;
            });
          }
          const dataUrl = canvas.toDataURL('image/png');
          return { size: p.size, canvas, dataUrl };
        }));
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
            backgroundColor: conversionConfig.backgroundColor
        }
      );
      }

      if (import.meta.env.DEV) {
        console.log('ICO generation completed:', {
          fileSize: generatedIco.fileSize,
          resolutions: generatedIco.resolutions.length
        });
      }

      let faviconPackage: FaviconPackage | undefined;
      if (conversionConfig.generateFaviconPackage || conversionConfig.includePNG || conversionConfig.includeWebP) {
        setCurrentStep(t('processing.generating_package'));
        setProgress(95);
        
        faviconPackage = await generateFaviconPackage(
          file,
          generatedIco.icoBlob,
          generatedIco.resolutions,
          conversionConfig
        );
      }

      const processed: ProcessedImage = {
        originalFile: file,
        originalUrl,
        originalWidth: width,
        originalHeight: height,
        faviconPackage,
        ...generatedIco
      };

      setProcessedImage(processed);
      
      const packageInfo = faviconPackage ? t('processing.package_info', { count: faviconPackage.files.length - 1 }) : '';
      toast({
        title: t('processing.success_toast_title'),
        description: t('processing.success_toast_description', { count: generatedIco.resolutions.length, packageInfo }),
      });

    } catch (error) {
      console.error('Error generating ICO:', error);
      const errorMessage = error instanceof Error ? error.message : t('processing.unknown_error');
      setProcessingError(errorMessage);
      
      toast({
        title: t('processing.error_toast_title'),
        description: t('processing.error_toast_description'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (import.meta.env.DEV) console.log('Resetting application state');
    if (processedImage?.originalUrl) {
      URL.revokeObjectURL(processedImage.originalUrl);
    }
    setProcessedImage(null);
    setProgress(0);
    setCurrentStep('');
    setProcessingError('');
    // Dar tempo para o usuário ajustar as configurações: rolar até as opções avançadas
    setTimeout(() => {
      const adv = document.getElementById('advanced-options');
      if (adv) {
        const headerOffset = 140;
        const y = adv.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow pt-20">
          <HeroSection 
            onImageUpload={handleImageUpload}
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
                  <div className="max-w-2xl mx-auto">
                    <ConversionSettings 
                      currentSettings={conversionConfig}
                      onSettingsChange={setConversionConfig}
                    />
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
                  className="container mx-auto px-4 py-8 space-y-8"
                  ref={resultsRef}
                >
                  <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading preview…</div>}>
                    <PreviewSection processedImage={processedImage} />
                    {processedImage.faviconPackage && (
                      <CodeGenerator faviconPackage={processedImage.faviconPackage} />
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
                <div className="container mx-auto px-4 py-16 space-y-16">
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

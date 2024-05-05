import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import AboutSection from '@/components/AboutSection';
import PreviewSection from '@/components/PreviewSection';
import CodeGenerator from '@/components/CodeGenerator';
import ConversionSettings, { ConversionConfig } from '@/components/ConversionSettings';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { generateIcoFromImage, GeneratedIco, IcoGenerationProgress } from '@/utils/icoGenerator';
import { generateFaviconPackage, FaviconPackage as FaviconPackageType } from '@/utils/faviconGenerator';
import { getImageDimensions } from '@/utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';

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
    includeWebP: false
  });
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (processedImage && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 200);
    }
  }, [processedImage]);

  const handleImageUpload = async (file: File) => {
    console.log('Starting conversion with config:', conversionConfig);
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('Iniciando...');
    setProcessingError('');

    try {
      const originalUrl = URL.createObjectURL(file);
      const { width, height } = await getImageDimensions(originalUrl);
      
      const generatedIco = await generateIcoFromImage(
        file, 
        conversionConfig.selectedSizes,
        (progress: number, currentStep: string) => {
          setProgress(progress);
          setCurrentStep(currentStep);
        }
      );

      console.log('ICO generation completed:', {
        fileSize: generatedIco.fileSize,
        resolutions: generatedIco.resolutions.length
      });

      let faviconPackage: FaviconPackage | undefined;
      if (conversionConfig.generateFaviconPackage || conversionConfig.includePNG || conversionConfig.includeWebP) {
        setCurrentStep('Gerando pacote completo...');
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
      
      const packageInfo = faviconPackage ? ` + ${faviconPackage.files.length - 1} arquivos extras` : '';
      toast({
        title: "Conversão concluída!",
        description: `ICO criado com ${generatedIco.resolutions.length} resoluções${packageInfo}`,
      });

    } catch (error) {
      console.error('Error generating ICO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProcessingError(errorMessage);
      
      toast({
        title: "Erro na conversão",
        description: "Tente novamente com um arquivo PNG ou JPG válido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    console.log('Resetting application state');
    if (processedImage?.originalUrl) {
      URL.revokeObjectURL(processedImage.originalUrl);
    }
    setProcessedImage(null);
    setProgress(0);
    setCurrentStep('');
    setProcessingError('');
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
                  <PreviewSection processedImage={processedImage} />
                  {processedImage.faviconPackage && (
                    <CodeGenerator faviconPackage={processedImage.faviconPackage} />
                  )}
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

import { Download, CheckCircle, FileIcon, Image as ImageIcon, Sparkles, Eye, Copy, Zap, Globe, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { downloadIcoFile, downloadZipPackage } from '@/utils/download';
import { formatFileSize } from '@/utils/fileUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const MotionButton = motion(Button);

interface PreviewSectionProps {
  processedImage: ProcessedImage;
}

const PreviewSection = ({ processedImage }: PreviewSectionProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'split' | 'light' | 'dark'>('split');

  const handleDownload = (type: 'ico' | 'zip') => {
    try {
      if (type === 'ico') {
      const filename = `${processedImage.originalFile.name.split('.')[0]}.ico`;
      downloadIcoFile(processedImage.icoBlob, filename);
        toast({ title: t('preview.download.toast.ico_started') });
      } else if (type === 'zip' && processedImage.faviconPackage?.zipBlob) {
        const filename = `${processedImage.faviconPackage.filename}.zip`;
        downloadZipPackage(processedImage.faviconPackage.zipBlob, filename);
        toast({ title: t('preview.download.toast.zip_started') });
      }
    } catch (error) {
      toast({
        title: t('preview.download.toast.error_title'),
        description: t('preview.download.toast.error_description'),
        variant: "destructive",
      });
    }
  };

  const hasPackage = processedImage.faviconPackage && processedImage.faviconPackage.zipBlob;

  const sizeCategories = {
    small: processedImage.resolutions.filter(r => r.size <= 32),
    medium: processedImage.resolutions.filter(r => r.size > 32 && r.size <= 64),
    large: processedImage.resolutions.filter(r => r.size > 64)
  };

  const getContextualUsage = (size: number) => {
    const usageMap: { [key: number]: { icon: any; color: string } } = {
      16: { icon: Globe, color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
      32: { icon: Globe, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
      48: { icon: Monitor, color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
      64: { icon: Smartphone, color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
      128: { icon: Download, color: "bg-pink-500/10 border-pink-500/20 text-pink-400" },
      256: { icon: Sparkles, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" }
    };
    const key = [16, 32, 48, 64, 128, 256].includes(size) ? size.toString() : 'default';
    return {
      name: t(`preview.usage.${key}.name`),
      description: t(`preview.usage.${key}.description`),
      ...(usageMap[size] || { icon: Eye, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" })
    };
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        ease: [0.4, 0.0, 0.2, 1],
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0.0, 0.2, 1] } 
    },
  };

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center space-y-2" variants={itemVariants}>
          <div className="relative">
          <motion.div
            className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl"
          />
          <CheckCircle className="h-8 w-8 text-orange-500 mx-auto relative z-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            {t('preview.title')}
          </h2>
          <p className="text-muted-foreground text-sm">{t('preview.subtitle')}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-orange-500" />
            <span>{t('preview.processing_details', { count: processedImage.resolutions.length })}</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div className="flex flex-col sm:flex-row gap-2 justify-center items-center" variants={itemVariants}>
        {hasPackage ? (
          <>
            <MotionButton 
              size="default" 
              onClick={() => handleDownload('zip')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group border-0 px-4 py-2 h-10 min-w-[240px] rounded-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98, y: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform duration-200" />
              {t('preview.download.zip_button', { size: formatFileSize(processedImage.faviconPackage!.zipBlob.size) })}
            </MotionButton>
            <MotionButton 
              variant="outline" 
              size="default" 
              onClick={() => handleDownload('ico')}
              className="border border-orange-500/40 hover:border-orange-400 bg-transparent hover:bg-orange-500/5 text-orange-400 hover:text-orange-300 font-semibold group px-4 py-2 h-10 min-w-[200px] rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98, y: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <FileIcon className="h-4 w-4 mr-2 group-hover:rotate-3 transition-transform duration-200" />
              {t('preview.download.ico_button', { size: formatFileSize(processedImage.icoBlob.size) })}
            </MotionButton>
          </>
        ) : (
          <MotionButton 
            size="default" 
            onClick={() => handleDownload('ico')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group border-0 px-4 py-2 h-10 min-w-[200px] rounded-lg"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98, y: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform duration-200" />
            {t('preview.download.ico_button_simple', { size: formatFileSize(processedImage.icoBlob.size) })}
          </MotionButton>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50 backdrop-blur-sm border border-white/10 max-w-md mx-auto">
            <TabsTrigger value="preview" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Eye className="h-4 w-4 mr-2" />
              {t('preview.tabs.preview')}
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <FileIcon className="h-4 w-4 mr-2" />
              {t('preview.tabs.details')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                  {[
                    { mode: 'split', label: t('preview.preview_modes.split'), icon: Copy },
                    { mode: 'light', label: t('preview.preview_modes.light'), icon: Globe },
                    { mode: 'dark', label: t('preview.preview_modes.dark'), icon: Monitor }
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        previewMode === mode 
                          ? 'bg-orange-500/20 text-orange-400 shadow-lg' 
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
            </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:shadow-[0_0_45px_rgba(249,115,22,0.25)] backdrop-blur-sm transition-all duration-300 ease-in-out">
                <div className="bg-black/50 rounded-[11px] p-6 h-full w-full">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{t('preview.grid.title')}</h3>
                    <p className="text-muted-foreground text-sm">{t('preview.grid.subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
                    {Object.entries(sizeCategories)
                      .flatMap(([category, resolutions]) => resolutions)
                      .sort((a, b) => a.size - b.size)
                      .map(({ size, dataUrl }) => {
                        const usage = getContextualUsage(size);
                        const Icon = usage.icon;
                        const isSelected = selectedSize === size;
                        
                        return (
                          <motion.div
                            key={size}
                            className={`relative group cursor-pointer w-full max-w-[120px] ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black/50' : ''}`}
                            onClick={() => setSelectedSize(isSelected ? null : size)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="bg-black/40 border border-white/10 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-orange-500/10">
                              <div className="aspect-square rounded-md border border-white/10 overflow-hidden mb-3 bg-gradient-to-br from-white/5 to-transparent">
                                {previewMode === 'split' ? (
                                  <div className="h-full grid grid-cols-2">
                                    <div className="bg-white flex items-center justify-center p-2">
                                      <img
                                        src={dataUrl}
                                        alt={`${size}x${size} light`}
                                        className="max-w-full max-h-full transition-transform duration-300 group-hover:scale-110"
                                        style={{ imageRendering: size <= 32 ? 'pixelated' : 'auto' }}
                                      />
              </div>
                                    <div className="bg-checkerboard flex items-center justify-center p-2">
                                      <img
                                        src={dataUrl}
                                        alt={`${size}x${size} dark`}
                                        className="max-w-full max-h-full transition-transform duration-300 group-hover:scale-110"
                                        style={{ imageRendering: size <= 32 ? 'pixelated' : 'auto' }}
                                      />
              </div>
            </div>
                                ) : (
                                  <div className={`h-full flex items-center justify-center p-2 ${
                                    previewMode === 'light' ? 'bg-white' : 'bg-gray-900'
                                  }`}>
                    <img
                      src={dataUrl}
                                      alt={`${size}x${size} preview`}
                                      className="max-w-full max-h-full transition-transform duration-300 group-hover:scale-110"
                      style={{ imageRendering: size <= 32 ? 'pixelated' : 'auto' }}
                    />
                                  </div>
                                )}
                              </div>

                              <div className="text-center space-y-2">
                                <p className="text-sm font-bold text-white">{size}×{size}px</p>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${usage.color}`}>
                                  <Icon className="h-3 w-3" />
                                  <span>{usage.name}</span>
                                </div>
                              </div>

                              <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                            </div>

                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="absolute top-full left-0 right-0 z-10 mt-2 bg-black/95 border border-orange-500/50 rounded-lg p-3 backdrop-blur-sm"
                                >
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium text-orange-400">{usage.description}</p>
                                    <p className="text-muted-foreground">Resolução: {size}×{size}px</p>
                                    <p className="text-muted-foreground">Uso: {usage.name}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
             <AnimatePresence mode="wait">
              {selectedSize ? (
                <motion.div 
                  key={selectedSize}
                  className="max-w-2xl mx-auto bg-black/30 p-6 rounded-xl border border-white/10"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-bold mb-4">{t('preview.details.title')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">{t('preview.details.size')}</span>
                      <Badge variant="outline" className="text-base">{selectedSize}x{selectedSize}px</Badge>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">{t('preview.details.usage')}</p>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const usage = getContextualUsage(selectedSize);
                          const Icon = usage.icon;
                          return (
                            <>
                              <div className={`p-2 rounded-md ${usage.color}`}>
                                <Icon className="h-5 w-5" />
                  </div>
                  <div>
                                <p className="font-semibold">{usage.name}</p>
                                <p className="text-sm text-muted-foreground">{usage.description}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">{t('preview.details.html_code')}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs p-2 rounded-md bg-black/50 text-orange-300 flex-grow overflow-x-auto">
                          {`<link rel="icon" href="/favicon.ico" sizes="${selectedSize}x${selectedSize}">`}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            navigator.clipboard.writeText(`<link rel="icon" href="/favicon.ico" sizes="${selectedSize}x${selectedSize}">`);
                            toast({ title: t('preview.details.copied_toast') });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-12 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>{t('preview.details.no_selection')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto mt-6 bg-black/30 p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-bold mb-4">{t('preview.details.tech_info.title')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.details.tech_info.original_name')}</span>
                  <span className="font-mono">{processedImage.originalFile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.details.tech_info.original_size')}</span>
                  <span className="font-mono">{formatFileSize(processedImage.originalFile.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.details.tech_info.original_dimensions')}</span>
                  <span className="font-mono">{processedImage.originalWidth}x{processedImage.originalHeight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.details.tech_info.generated_icons')}</span>
                  <span className="font-mono">{processedImage.resolutions.length}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default PreviewSection;


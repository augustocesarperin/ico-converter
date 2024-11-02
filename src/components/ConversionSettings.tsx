import { useState } from 'react';
import { Settings, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const MotionButton = motion.create(Button);

interface ConversionSettingsProps {
  onSettingsChange: (settings: ConversionConfig) => void;
  currentSettings: ConversionConfig;
}

export interface ConversionConfig {
  selectedSizes: number[];
  quality: number;
  filename: string;
  generateFaviconPackage: boolean;
  includeWebP: boolean;
  includePNG: boolean;
  preserveAspectRatio: boolean;
  backgroundTransparent: boolean;
  backgroundColor: string;
  crispSmallIcons: boolean;
  smallIconMode: boolean;
  smallIconStrength16: number;
}

const AVAILABLE_SIZES = [16, 24, 32, 48, 64, 96, 128, 152, 192, 256, 512];

const ConversionSettings = ({ onSettingsChange, currentSettings }: ConversionSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState<'website' | 'pwa' | 'windows' | null>(null);
  const { t } = useTranslation();

  const updateSettings = (key: keyof ConversionConfig, value: ConversionConfig[keyof ConversionConfig]) => {
    setActivePreset(null);
    onSettingsChange({ ...currentSettings, [key]: value });
  };

  const toggleSize = (size: number) => {
    const newSizes = currentSettings.selectedSizes.includes(size)
      ? currentSettings.selectedSizes.filter(s => s !== size)
      : [...currentSettings.selectedSizes, size].sort((a, b) => a - b);
    setActivePreset(null);
    updateSettings('selectedSizes', newSizes);
  };

  return (
    <div className={cn(
      "w-full max-w-xl sm:max-w-2xl mx-auto bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out",
      "shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:shadow-[0_0_45px_rgba(249,115,22,0.25)]",
      isExpanded && "shadow-[0_0_45px_rgba(249,115,22,0.3)]"
    )}>
      <div className="bg-black/50 rounded-[11px] h-full w-full">
        <div 
          className="flex items-center justify-between cursor-pointer p-3 sm:p-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('settings.title')}</h3>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="h-5 w-5 text-foreground/80" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 sm:px-6 pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activePreset === 'website' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      onSettingsChange({
                        ...currentSettings,
                        selectedSizes: [16, 32, 48, 64, 128, 256],
                        generateFaviconPackage: true,
                        includePNG: true,
                        includeWebP: false,
                        preserveAspectRatio: true,
                      });
                      setActivePreset('website');
                    }}
                  >{t('settings.presets.website') || 'Website'}</Button>
                  <Button
                    variant={activePreset === 'pwa' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      onSettingsChange({
                        ...currentSettings,
                        selectedSizes: [16, 32, 48, 64, 128, 256],
                        generateFaviconPackage: true,
                        includePNG: true,
                        includeWebP: true,
                        preserveAspectRatio: true,
                      });
                      setActivePreset('pwa');
                    }}
                  >{t('settings.presets.pwa') || 'PWA'}</Button>
                  <Button
                    variant={activePreset === 'windows' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      onSettingsChange({
                        ...currentSettings,
                        selectedSizes: [16, 24, 32, 48, 64, 128, 256],
                        generateFaviconPackage: false,
                        includePNG: false,
                        includeWebP: false,
                        preserveAspectRatio: true,
                      });
                      setActivePreset('windows');
                    }}
                  >{t('settings.presets.windows') || 'Windows/Electron'}</Button>
                </div>
              </div>

              <div className="border-t border-white/10 p-3 sm:p-6 pt-4 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="filename">{t('settings.filename_label')}</Label>
                    <Input
                      id="filename"
                      value={currentSettings.filename}
                      onChange={(e) => updateSettings('filename', e.target.value)}
                      placeholder="favicon"
                      className="bg-black/40 border-white/20"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>{t('settings.quality_label')}</Label>
                      <span className="text-sm text-muted-foreground">{Math.round(currentSettings.quality * 100)}%</span>
                    </div>
                    <Slider
                      value={[currentSettings.quality]}
                      onValueChange={([value]) => updateSettings('quality', value)}
                      min={0.1}
                      max={1}
                      step={0.05}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t('settings.resolutions_label')}</Label>
                    <span className="text-xs text-muted-foreground">{currentSettings.selectedSizes.length} selected</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {AVAILABLE_SIZES.map((size) => (
                      <MotionButton
                        key={size}
                        variant="outline"
                        onClick={() => toggleSize(size)}
                        aria-pressed={currentSettings.selectedSizes.includes(size)}
                        className={cn(
                          'text-xs h-8 relative',
                          currentSettings.selectedSizes.includes(size)
                            ? 'bg-orange-600 text-white border-orange-500 hover:bg-orange-500 hover:text-white ring-1 ring-orange-500'
                            : 'hover:border-orange-400'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {currentSettings.selectedSizes.includes(size) && (
                            <Check className="h-3 w-3" />
                          )}
                          {size}x{size}
                        </span>
                      </MotionButton>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('settings.resolutions_hint', { defaultValue: 'Selected sizes go into the ICO. PNG/WebP in the ZIP follow the toggles below.' })}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>{t('settings.preserve_aspect_label')}</Label>
                  <div className="space-y-3 rounded-lg bg-black/40 p-4 border border-white/20">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="preserve-aspect"
                        checked={currentSettings.preserveAspectRatio}
                        onCheckedChange={(checked) => updateSettings('preserveAspectRatio', !!checked)}
                      />
                      <Label htmlFor="preserve-aspect" className="text-sm font-normal cursor-pointer">
                        {t('settings.preserve_aspect_label')}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="crisp-small"
                        checked={currentSettings.crispSmallIcons}
                        onCheckedChange={(checked) => updateSettings('crispSmallIcons', !!checked)}
                      />
                      <Label htmlFor="crisp-small" className="text-sm font-normal cursor-pointer">
                        {t('settings.crisp_small_label')}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="small-icon-mode"
                        checked={currentSettings.smallIconMode}
                        onCheckedChange={(checked) => updateSettings('smallIconMode', !!checked)}
                      />
                      <Label htmlFor="small-icon-mode" className="text-sm font-normal cursor-pointer">
                        {t('settings.small_icon_mode_label')}
                      </Label>
                    </div>

                    {currentSettings.smallIconMode && (
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>{t('settings.small_icon_strength_label')}</Label>
                          <span className="text-xs text-muted-foreground">{currentSettings.smallIconStrength16.toFixed(1)}px</span>
                        </div>
                        <Slider
                          value={[currentSettings.smallIconStrength16]}
                          onValueChange={([value]) => updateSettings('smallIconStrength16', value)}
                          min={0}
                          max={2}
                          step={0.1}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>{t('settings.background_label')}</Label>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="bg-transparent"
                          checked={currentSettings.backgroundTransparent}
                          onCheckedChange={(checked) => updateSettings('backgroundTransparent', !!checked)}
                        />
                        <Label htmlFor="bg-transparent" className="text-sm font-normal cursor-pointer">
                          {t('settings.background_transparent')}
                        </Label>

                        <Input
                          type="color"
                          value={currentSettings.backgroundColor}
                          onChange={(e) => updateSettings('backgroundColor', e.target.value)}
                          disabled={currentSettings.backgroundTransparent}
                          className="w-10 h-8 p-1 bg-black/40 border-white/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>{t('settings.package_label')}</Label>
                  <div className="space-y-3 rounded-lg bg-black/40 p-4 border border-white/20">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="favicon-package"
                        checked={currentSettings.generateFaviconPackage}
                        onCheckedChange={(checked) => {
                          const isChecked = !!checked;
                          onSettingsChange({
                            ...currentSettings,
                            generateFaviconPackage: isChecked,
                            // Ao habilitar o pacote, manter PNGs individuais ligados por padrão
                            includePNG: isChecked ? true : false,
                            includeWebP: isChecked ? currentSettings.includeWebP : false,
                          });
                        }}
                      />
                      <Label htmlFor="favicon-package" className="text-sm font-normal cursor-pointer">
                        {t('settings.package_option.generate')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="include-png"
                        checked={currentSettings.includePNG}
                        onCheckedChange={(checked) => updateSettings('includePNG', !!checked)}
                        disabled={!currentSettings.generateFaviconPackage}
                      />
                      <Label htmlFor="include-png" className="text-sm font-normal cursor-pointer data-[disabled]:opacity-50">
                        {t('settings.package_option.include_png')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="include-webp"
                        checked={currentSettings.includeWebP}
                        onCheckedChange={(checked) => updateSettings('includeWebP', !!checked)}
                        disabled={!currentSettings.generateFaviconPackage}
                      />
                      <Label htmlFor="include-webp" className="text-sm font-normal cursor-pointer data-[disabled]:opacity-50">
                        {t('settings.package_option.include_webp')}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversionSettings;

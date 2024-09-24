import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const MotionButton = motion(Button);

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
  const { t } = useTranslation();

  const updateSettings = (key: keyof ConversionConfig, value: any) => {
    onSettingsChange({ ...currentSettings, [key]: value });
  };

  const toggleSize = (size: number) => {
    const newSizes = currentSettings.selectedSizes.includes(size)
      ? currentSettings.selectedSizes.filter(s => s !== size)
      : [...currentSettings.selectedSizes, size].sort((a, b) => a - b);
    updateSettings('selectedSizes', newSizes);
  };

  return (
    <div className={cn(
      "w-full max-w-2xl mx-auto bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out",
      "shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:shadow-[0_0_45px_rgba(249,115,22,0.25)]",
      isExpanded && "shadow-[0_0_45px_rgba(249,115,22,0.3)]"
    )}>
      <div className="bg-black/50 rounded-[11px] h-full w-full">
        <div 
          className="flex items-center justify-between cursor-pointer p-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{t('settings.title')}</h3>
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
              <div className="px-6 pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSettingsChange({
                      ...currentSettings,
                      selectedSizes: [16, 32, 48, 64, 128, 256],
                      generateFaviconPackage: true,
                      includePNG: true,
                      includeWebP: false,
                      preserveAspectRatio: true,
                    })}
                  >{t('settings.presets.website') || 'Website'}</Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSettingsChange({
                      ...currentSettings,
                      selectedSizes: [16, 32, 48, 64, 128, 256],
                      generateFaviconPackage: true,
                      includePNG: true,
                      includeWebP: true,
                      preserveAspectRatio: true,
                    })}
                  >{t('settings.presets.pwa') || 'PWA'}</Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSettingsChange({
                      ...currentSettings,
                      selectedSizes: [16, 24, 32, 48, 64, 128, 256],
                      generateFaviconPackage: false,
                      includePNG: false,
                      includeWebP: false,
                      preserveAspectRatio: true,
                    })}
                  >{t('settings.presets.windows') || 'Windows/Electron'}</Button>
                </div>
              </div>

              <div className="border-t border-white/10 p-6 pt-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                <div className="space-y-4">
                  <Label>{t('settings.resolutions_label')}</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {AVAILABLE_SIZES.map((size) => (
                      <MotionButton
                        key={size}
                        variant={currentSettings.selectedSizes.includes(size) ? 'secondary' : 'outline'}
                        onClick={() => toggleSize(size)}
                        className="text-xs h-8"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        {size}x{size}
                      </MotionButton>
                    ))}
                  </div>
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
                            includePNG: isChecked ? currentSettings.includePNG : false,
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

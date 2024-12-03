import { Download, Package, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConversionConfig } from "./ConversionSettings";

interface SimpleSettingsProps {
  currentSettings: ConversionConfig;
  onSettingsChange: (settings: ConversionConfig) => void;
}

const SimpleSettings = ({ currentSettings, onSettingsChange }: SimpleSettingsProps) => {
  const { t } = useTranslation();

  const updateSettings = (key: keyof ConversionConfig, value: any) => {
    onSettingsChange({ ...currentSettings, [key]: value });
  };

  return (
    <Card className="border-orange-500/20 bg-black/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          {t("settings.simple.title", { defaultValue: "Configurações Rápidas" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets rápidos */}
        <div>
          <Label className="mb-3 block text-sm font-medium">
            {t("settings.simple.preset_label", { defaultValue: "Escolha um tipo:" })}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSettingsChange({
                  ...currentSettings,
                  selectedSizes: [16, 32, 48, 64, 128, 256],
                  generateFaviconPackage: true,
                  includePNG: true,
                  includeWebP: false,
                  preserveAspectRatio: true,
                  backgroundTransparent: true,
                  crispSmallIcons: true,
                  smallIconMode: false,
                  outline16px: false,
                  autoProfile: true,
                  windowsAssets: false,
                });
              }}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t("settings.simple.preset_basic", { defaultValue: "Básico" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSettingsChange({
                  ...currentSettings,
                  selectedSizes: [16, 32, 48, 64, 128, 256],
                  generateFaviconPackage: true,
                  includePNG: true,
                  includeWebP: true,
                  preserveAspectRatio: true,
                  backgroundTransparent: true,
                  crispSmallIcons: true,
                  smallIconMode: false,
                  outline16px: false,
                  autoProfile: true,
                  windowsAssets: false,
                });
              }}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              {t("settings.simple.preset_complete", { defaultValue: "Completo" })}
            </Button>
          </div>
        </div>

        {/* Apenas 2 opções essenciais */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="preserve-ratio"
              checked={currentSettings.preserveAspectRatio}
              onCheckedChange={(checked) => updateSettings("preserveAspectRatio", !!checked)}
            />
            <Label htmlFor="preserve-ratio" className="cursor-pointer text-sm">
              {t("settings.simple.preserve_ratio", { defaultValue: "Manter proporção da imagem" })}
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="package"
              checked={currentSettings.generateFaviconPackage}
              onCheckedChange={(checked) => updateSettings("generateFaviconPackage", !!checked)}
            />
            <Label htmlFor="package" className="cursor-pointer text-sm">
              {t("settings.simple.include_package", { defaultValue: "Incluir pacote completo (manifest, etc.)" })}
            </Label>
          </div>
        </div>

        {/* Info rápida */}
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-muted-foreground">
            {t("settings.simple.info", { 
              defaultValue: "Tamanhos incluídos: 16, 32, 48, 64, 128, 256px. Para mais opções, use o modo Personalizar." 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleSettings;





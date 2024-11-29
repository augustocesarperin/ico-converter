import { AnimatePresence, motion } from "framer-motion";
import { Settings, ChevronDown, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
// (Radios removed) using segmented buttons for stability
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
// Tooltips removidos em favor de titles simples nas labels/botões
import { cn } from "@/lib/utils";
// Collapsible removed for small-icon quality; now always visible below Exportar

const MotionButton = motion.create(Button);

interface ConversionSettingsProps {
  onSettingsChange: (settings: ConversionConfig) => void;
  currentSettings: ConversionConfig;
  isSimpleMode?: boolean;
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
  windowsAssets?: boolean;
  windowsProfile?: "minimal" | "recommended" | "complete";
  outline16px?: boolean;
  autoProfile?: boolean;
  windowsCanonicalNames?: boolean;
  windowsOrganizeZip?: boolean;
}

const AVAILABLE_SIZES = [
  16, 24, 32, 44, 48, 64, 96, 128, 150, 152, 192, 256, 512,
];

const ConversionSettings = ({
  onSettingsChange,
  currentSettings,
  isSimpleMode = false,
}: ConversionSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState<
    "website" | "pwa" | "windows" | "windowsStore" | "compatSoft" | null
  >(null);
  const [activeSmallPreset, setActiveSmallPreset] = useState<
    "neutral" | "sharp" | "soft" | null
  >(null);
  const [showExportChooser, setShowExportChooser] = useState(false);
  const [windowsAdvancedOpen, setWindowsAdvancedOpen] = useState(false);
  useEffect(() => {
    if (activePreset) setShowExportChooser(false);
  }, [activePreset]);
  const { t } = useTranslation();
  const defaultSettings: ConversionConfig = {
    selectedSizes: [16, 32, 48, 64, 128, 256],
    quality: 0.95,
    filename: "favicon",
    generateFaviconPackage: true,
    includePNG: true,
    includeWebP: false,
    preserveAspectRatio: true,
    backgroundTransparent: true,
    backgroundColor: "#000000",
    crispSmallIcons: true,
    smallIconMode: false,
    smallIconStrength16: 1.2,
    windowsAssets: false,
    windowsProfile: "recommended",
    outline16px: false,
    autoProfile: true,
    windowsCanonicalNames: false,
    windowsOrganizeZip: true,
  };

  const updateSettings = (
    key: keyof ConversionConfig,
    value: ConversionConfig[keyof ConversionConfig],
  ) => {
    setActiveSmallPreset(null);
    onSettingsChange({ ...currentSettings, [key]: value });
  };

  const toggleSize = (size: number) => {
    const newSizes = currentSettings.selectedSizes.includes(size)
      ? currentSettings.selectedSizes.filter((s) => s !== size)
      : [...currentSettings.selectedSizes, size].sort((a, b) => a - b);
    updateSettings("selectedSizes", newSizes);
  };

  return (
    <div
      id="advanced-options"
      className={cn(
      "w-full max-w-[860px] mx-auto bg-gradient-to-br from-orange-500/25 via-transparent to-transparent p-[1px] rounded-2xl backdrop-blur-sm transition-all duration-300 ease-in-out",
      "shadow-[0_0_24px_rgba(249,115,22,0.12)] hover:shadow-[0_0_32px_rgba(249,115,22,0.2)]",
        isExpanded && "shadow-[0_0_45px_rgba(249,115,22,0.3)]",
      )}
    >
      <div className="h-full w-full rounded-2xl bg-black/50">
        <div
          className="flex cursor-pointer items-center justify-between p-4 sm:p-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              {isSimpleMode 
                ? t("settings.title_simple", { defaultValue: "Configurações" })
                : t("settings.title", { defaultValue: "Opções Avançadas" })
              }
            </h3>
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
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-2 sm:px-6 sm:pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {!isSimpleMode && (
                    <>
                      <Button
                        variant={activePreset === "compatSoft" ? "default" : "secondary"}
                        size="sm"
                        className="hover-focus-unified focus-visible-ring"
                        onClick={() => {
                          onSettingsChange({
                            ...currentSettings,
                            selectedSizes: [16, 32, 48, 64, 128, 256],
                            generateFaviconPackage: false,
                            includePNG: false,
                            includeWebP: false,
                            preserveAspectRatio: true,
                            autoProfile: false,
                            crispSmallIcons: true,
                            smallIconMode: false,
                            smallIconStrength16: 1.0,
                            outline16px: false,
                            windowsAssets: false,
                          });
                          setActivePreset("compatSoft");
                        }}
                      >
                        {t("settings.presets_extra.compat", { defaultValue: "Compatível (suave)" })}
                      </Button>
                      
                    </>
                  )}
                  <Button
                    variant={
                      activePreset === "website" ? "default" : "secondary"
                    }
                    size="sm"
                    className="hover-focus-unified focus-visible-ring"
                    onClick={() => {
                      onSettingsChange({
                      ...currentSettings,
                      selectedSizes: [16, 32, 48, 64, 128, 256],
                      generateFaviconPackage: true,
                      includePNG: true,
                      includeWebP: false,
                      preserveAspectRatio: true,
                        // Small icon quality defaults
                        autoProfile: true,
                        crispSmallIcons: true,
                        smallIconMode: false,
                        smallIconStrength16: 1.0,
                        outline16px: false,
                        // Ensure Windows extras are off in this preset
                        windowsAssets: false,
                      });
                      setActivePreset("website");
                    }}
                  >
                    {t("settings.presets.website", { defaultValue: "Website" })}
                  </Button>
                  <Button
                    variant={activePreset === "pwa" ? "default" : "secondary"}
                    size="sm"
                    className="hover-focus-unified focus-visible-ring"
                    onClick={() => {
                      onSettingsChange({
                      ...currentSettings,
                      selectedSizes: [16, 32, 48, 64, 128, 256],
                      generateFaviconPackage: true,
                      includePNG: true,
                      includeWebP: true,
                      preserveAspectRatio: true,
                        autoProfile: true,
                        crispSmallIcons: true,
                        smallIconMode: false,
                        smallIconStrength16: 1.0,
                        outline16px: false,
                        windowsAssets: false,
                      });
                      setActivePreset("pwa");
                    }}
                  >
                    {t("settings.presets.pwa", { defaultValue: "PWA" })}
                  </Button>
                  <Button
                    variant={
                      activePreset === "windows" ? "default" : "secondary"
                    }
                    size="sm"
                    className="hover-focus-unified focus-visible-ring"
                    onClick={() => {
                      onSettingsChange({
                      ...currentSettings,
                        // Windows/Electron preset: inclui 44x44 e 150x150
                        selectedSizes: [
                          16, 24, 32, 44, 48, 64, 96, 128, 150, 256,
                        ],
                      generateFaviconPackage: false,
                      includePNG: false,
                      includeWebP: false,
                      preserveAspectRatio: true,
                        windowsAssets: true,
                        windowsProfile: "recommended",
                        windowsOrganizeZip: true,
                        windowsCanonicalNames: false,
                        autoProfile: false,
                      });
                      setActivePreset("windows");
                    }}
                  >
                    {t("settings.presets.windows", { defaultValue: "Windows/Electron" })}
                  </Button>
                  <Button
                    variant={
                      activePreset === "windowsStore" ? "default" : "secondary"
                    }
                    size="sm"
                    className="hover-focus-unified focus-visible-ring"
                    onClick={() => {
                      onSettingsChange({
                        ...currentSettings,
                        selectedSizes: [16, 20, 24, 32, 44, 48, 128, 256],
                        generateFaviconPackage: false,
                        includePNG: true,
                        includeWebP: false,
                        preserveAspectRatio: true,
                        windowsAssets: true,
                      });
                      setActivePreset("windowsStore");
                    }}
                  >
                    {t("settings.presets.windows_store", { defaultValue: "Windows Store" })}
                  </Button>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSettingsChange(defaultSettings);
                      try { localStorage.setItem('icosmith:lastPreset', 'website'); } catch { /* noop */ }
                    }}
                  >
                    {t("settings.reset_defaults", { defaultValue: "Restaurar padrão" })}
                  </Button>
                </div>
              </div>

              <div className="mt-1 space-y-6 border-t border-white/5 p-3 pt-4 sm:space-y-8 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="filename">
                      {t("settings.filename_label")}
                    </Label>
                    <Input
                      id="filename"
                      value={currentSettings.filename}
                      onChange={(e) =>
                        updateSettings("filename", e.target.value)
                      }
                      placeholder="favicon"
                      className="border-white/20 bg-black/40"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-profile"
                        checked={currentSettings.autoProfile ?? true}
                        onCheckedChange={(checked) =>
                          updateSettings("autoProfile", !!checked)
                        }
                        aria-describedby="tip-auto-profile"
                      />
                      <Label htmlFor="auto-profile" className="cursor-pointer text-sm font-normal">
                        Auto (detectar melhor nitidez/cor)
                      </Label>
                      
                    </div>

                    {currentSettings.includeWebP && (
                      <>
                    <div className="flex justify-between">
                          <Label>{t("settings.quality_label")}</Label>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(currentSettings.quality * 100)}%
                          </span>
                    </div>
                    <Slider
                      value={[currentSettings.quality]}
                          onValueChange={([value]) =>
                            updateSettings("quality", value)
                          }
                      min={0.1}
                      max={1}
                      step={0.05}
                    />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("settings.resolutions_label")}</Label>
                    <span className="text-xs text-muted-foreground">
                      {currentSettings.selectedSizes.length} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {AVAILABLE_SIZES.map((size) => (
                      <MotionButton
                        key={size}
                        variant="outline"
                        onClick={() => toggleSize(size)}
                        aria-pressed={currentSettings.selectedSizes.includes(
                          size,
                        )}
                        className={cn(
                          "text-sm h-9 px-3 font-medium relative hover-focus-unified focus-visible-ring",
                          currentSettings.selectedSizes.includes(size)
                            ? "bg-orange-500/20 text-orange-100 border-orange-400/40 hover:bg-orange-500/30 ring-1 ring-orange-400/40"
                            : "bg-black/30 border-white/15 text-foreground/90 hover:border-orange-400/40 hover:bg-white/5",
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
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
                    {t("settings.resolutions_hint", {
                      defaultValue:
                        "Selected sizes go into the ICO. PNG/WebP in the ZIP follow the toggles below.",
                    })}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>{t("settings.preserve_aspect_label")}</Label>
                  <div className="space-y-3 rounded-lg border border-white/20 bg-black/40 p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="preserve-aspect"
                        checked={currentSettings.preserveAspectRatio}
                        onCheckedChange={(checked) =>
                          updateSettings("preserveAspectRatio", !!checked)
                        }
                      />
                      <Label
                        htmlFor="preserve-aspect"
                        className="cursor-pointer text-sm font-normal"
                      >
                        {t("settings.preserve_aspect_label")}
                      </Label>
                    </div>

                    

                    {/* Small icon quality controls moved below Exportar */}

                    {currentSettings.generateFaviconPackage && (
                    <div className="space-y-2">
                      <Label>{t("settings.background_label", { defaultValue: "Fundo" })}</Label>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="bg-transparent"
                          checked={currentSettings.backgroundTransparent}
                          onCheckedChange={(checked) =>
                            updateSettings("backgroundTransparent", !!checked)
                          }
                        />
                        <Label
                          htmlFor="bg-transparent"
                          className="cursor-pointer text-sm font-normal"
                        >
                          {t("settings.background_transparent")}
                        </Label>

                        {!currentSettings.backgroundTransparent && (
                          <Input
                            type="color"
                            value={currentSettings.backgroundColor}
                            onChange={(e) =>
                              updateSettings("backgroundColor", e.target.value)
                            }
                            className="h-8 w-10 border-white/20 bg-black/40 p-1"
                          />
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                {activePreset === null && (
                  <div className="space-y-4">
                    <Label>{t("settings.package_label", { defaultValue: "Exportar para" })}</Label>
                    <div className="space-y-4 rounded-lg border border-white/20 bg-black/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/30 p-3 text-sm">
                        <span className="text-foreground/90">
                          {t("settings.output_label", { defaultValue: "Saída:" })} {" "}
                          <strong>
                            {currentSettings.generateFaviconPackage && currentSettings.windowsAssets
                              ? t("settings.output.both_short", { defaultValue: "Ambos (Site + Windows)" })
                              : currentSettings.generateFaviconPackage
                              ? t("settings.output.web_short", { defaultValue: "Website/PWA" })
                              : t("settings.output.windows_short", { defaultValue: "Windows" })}
                          </strong>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setShowExportChooser(v => !v)}>
                          {showExportChooser ? t("common.done", { defaultValue: "Pronto" }) : t("common.edit", { defaultValue: "Editar" })}
                        </Button>
                      </div>

                      {showExportChooser && (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(["web","windows","both"] as const).map((opt) => {
                            const selected = (opt === "both" && currentSettings.generateFaviconPackage && currentSettings.windowsAssets)
                              || (opt === "web" && currentSettings.generateFaviconPackage && !currentSettings.windowsAssets)
                              || (opt === "windows" && !currentSettings.generateFaviconPackage && currentSettings.windowsAssets);
                            const label = opt === "web" ? t("settings.export.web", { defaultValue: "Website/PWA" }) : opt === "windows" ? t("settings.export.windows", { defaultValue: "Windows" }) : t("settings.export.both", { defaultValue: "Ambos" });
                            return (
                              <Button
                                key={opt}
                                variant={selected ? "default" : "outline"}
                                className="justify-center"
                                onClick={() => {
                                  if (opt === "web") {
                                    onSettingsChange({ ...currentSettings, generateFaviconPackage: true, windowsAssets: false, includePNG: true });
                                  } else if (opt === "windows") {
                                    onSettingsChange({ ...currentSettings, generateFaviconPackage: false, windowsAssets: true });
                                  } else {
                                    onSettingsChange({ ...currentSettings, generateFaviconPackage: true, windowsAssets: true, includePNG: true });
                                  }
                                }}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </div>
                      )}

                      <div className="rounded-md bg-black/30 p-3 text-xs text-muted-foreground">
                        <span className="mr-2 font-medium text-foreground">{t("settings.output_label", { defaultValue: "Saída:" })}</span>
                        {currentSettings.generateFaviconPackage && currentSettings.windowsAssets && (
                          <span>
                            {t("settings.output.both", { defaultValue: "Website/PWA (favicon.ico, apple-touch-icon, site.webmanifest, safari-pinned-tab.svg, PNGs) + Windows (taskbar/tiles/StoreLogo)" })}
                          </span>
                        )}
                        {currentSettings.generateFaviconPackage && !currentSettings.windowsAssets && (
                          <span>
                            {t("settings.output.web", { defaultValue: "Website/PWA (favicon.ico, apple-touch-icon, site.webmanifest, safari-pinned-tab.svg, PNGs)" })}
                          </span>
                        )}
                        {!currentSettings.generateFaviconPackage && currentSettings.windowsAssets && (
                          <span>
                            {t("settings.output.windows", { defaultValue: "Windows (taskbar targetsize 16–48/96, Square150/Wide310/Square310, StoreLogo)" })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="include-png"
                          checked={currentSettings.includePNG}
                          onCheckedChange={(checked) =>
                            updateSettings("includePNG", !!checked)
                          }
                          disabled={!currentSettings.generateFaviconPackage}
                        />
                        <Label
                          htmlFor="include-png"
                          className="cursor-pointer text-sm font-normal data-[disabled]:opacity-50"
                        >
                          {t("settings.package_option.include_png")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="include-webp"
                          checked={currentSettings.includeWebP}
                          onCheckedChange={(checked) =>
                            updateSettings("includeWebP", !!checked)
                          }
                          disabled={!currentSettings.generateFaviconPackage}
                        />
                        <Label
                          htmlFor="include-webp"
                          className="cursor-pointer text-sm font-normal data-[disabled]:opacity-50"
                        >
                          {t("settings.package_option.include_webp")}
                        </Label>
                      </div>

                      {currentSettings.windowsAssets && (
                        <>
                          <div className="flex items-center gap-2 text-xs">
                            <Button
                              size="sm"
                              title="Taskbar (16–48) + Square150"
                              variant={
                                currentSettings.windowsProfile === "minimal"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                updateSettings("windowsProfile", "minimal")
                              }
                            >
                              {t("settings.windows.profile_min", { defaultValue: "Minimal" })}
                            </Button>
                            <Button
                              size="sm"
                              title="Taskbar + StoreLogo + Square150"
                              variant={
                                currentSettings.windowsProfile === "recommended"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                updateSettings("windowsProfile", "recommended")
                              }
                            >
                              {t("settings.windows.profile_rec", { defaultValue: "Recommended" })}
                            </Button>
                            <Button
                              size="sm"
                              title="Taskbar + Square150/Wide310/Square310 + StoreLogo"
                              variant={
                                currentSettings.windowsProfile === "complete"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                updateSettings("windowsProfile", "complete")
                              }
                            >
                              {t("settings.windows.profile_full", { defaultValue: "Complete" })}
                            </Button>
                          </div>

                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setWindowsAdvancedOpen((v) => !v)}
                            >
                              {windowsAdvancedOpen
                                ? t("common.hide", { defaultValue: "Ocultar avançado" })
                                : t("settings.windows.advanced", { defaultValue: "Avançado (Windows)" })}
                            </Button>

                            {windowsAdvancedOpen && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-start space-x-3">
                                  <Checkbox
                                    id="windows-canonical"
                                    checked={currentSettings.windowsCanonicalNames ?? false}
                                    onCheckedChange={(checked) =>
                                      updateSettings("windowsCanonicalNames", !!checked)
                                    }
                                    aria-describedby="tip-wincan"
                                  />
                                  <Label
                                    htmlFor="windows-canonical"
                                    className="cursor-pointer text-sm font-normal"
                                  >
                                    {t("settings.windows_canonical", {
                                      defaultValue:
                                        "Also export canonical VS names (Square44x44Logo.png, Square150x150Logo.png, Wide310x150Logo.png, Square310x310Logo.png, StoreLogo.png)",
                                    })}
                                  </Label>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <Checkbox
                                    id="windows-organize"
                                    checked={currentSettings.windowsOrganizeZip ?? true}
                                    onCheckedChange={(checked) =>
                                      updateSettings("windowsOrganizeZip", !!checked)
                                    }
                                    aria-describedby="tip-winorg"
                                  />
                                  <Label
                                    htmlFor="windows-organize"
                                    className="cursor-pointer text-sm font-normal"
                                  >
                                    {t("settings.windows_organize", {
                                      defaultValue:
                                        "Organize Windows ZIP in subfolders (Assets/Taskbar, Assets/Tiles, Assets/StoreLogo)",
                                    })}
                                  </Label>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Small icon quality (always visible, moved below Exportar) */}
                {!isSimpleMode && (
                  <div className="space-y-3">
                    <Label className="mb-1 block">
                      {t("settings.small_icon_profile_label", { defaultValue: "Qualidade dos ícones pequenos (16/32)" })}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={activeSmallPreset === "neutral" ? "default" : "outline"}
                        title={t("settings.small_icon_profile.neutral_hint", { defaultValue: "Padrão. Balanceado, sem realce extra." })}
                        onClick={() => {
                          onSettingsChange({
                            ...currentSettings,
                            outline16px: false,
                            smallIconMode: false,
                            smallIconStrength16: 1.0,
                            crispSmallIcons: true,
                            autoProfile: false,
                          });
                          setActiveSmallPreset("neutral");
                        }}
                      >
                        {t("settings.small_icon_profile.neutral", { defaultValue: "Neutro" })}
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSmallPreset === "sharp" ? "default" : "outline"}
                        title={t("settings.small_icon_profile.sharp_hint", { defaultValue: "Realça bordas/contraste. Bom para logos grossas." })}
                        onClick={() => {
                          onSettingsChange({
                            ...currentSettings,
                            outline16px: true,
                            smallIconMode: false,
                            smallIconStrength16: 1.2,
                            crispSmallIcons: true,
                            autoProfile: false,
                          });
                          setActiveSmallPreset("sharp");
                        }}
                      >
                        {t("settings.small_icon_profile.sharp", { defaultValue: "Nítido" })}
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSmallPreset === "soft" ? "default" : "outline"}
                        title={t("settings.small_icon_profile.soft_hint", { defaultValue: "Atenua e preserva traços finos. Bom para logos finas." })}
                        onClick={() => {
                          onSettingsChange({
                            ...currentSettings,
                            outline16px: false,
                            smallIconMode: true,
                            smallIconStrength16: 0.6,
                            crispSmallIcons: true,
                            autoProfile: false,
                          });
                          setActiveSmallPreset("soft");
                        }}
                      >
                        {t("settings.small_icon_profile.soft", { defaultValue: "Suave" })}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversionSettings;

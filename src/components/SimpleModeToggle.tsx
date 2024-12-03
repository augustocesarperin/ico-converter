import { Settings, Eye, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleModeToggleProps {
  isSimpleMode: boolean;
  onToggle: (isSimple: boolean) => void;
}

const SimpleModeToggle = ({ isSimpleMode, onToggle }: SimpleModeToggleProps) => {
  const { t } = useTranslation();

  return (
    <Card className="border-orange-500/20 bg-black/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          {t("settings.mode.title", { defaultValue: "Modo de Configuração" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant={isSimpleMode ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {t("settings.mode.simple", { defaultValue: "Rápido" })}
          </Button>
          <Button
            variant={!isSimpleMode ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(false)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t("settings.mode.advanced", { defaultValue: "Personalizar" })}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isSimpleMode
            ? t("settings.mode.simple_desc", {
                defaultValue: "Apenas o essencial - envie e baixe",
              })
            : t("settings.mode.advanced_desc", {
                defaultValue: "Controle total sobre todas as opções",
              })}
        </p>
      </CardContent>
    </Card>
  );
};

export default SimpleModeToggle;

import { motion, Variants } from "framer-motion";
import { ImageDown, Layers, FolderTree, AppWindow } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/utils/analytics";
import BackgroundReflection from "./BackgroundReflection";

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: ImageDown,
      titleKey: "features.png_to_ico.title",
      descriptionKey: "features.png_to_ico.description",
      href: "#advanced-options",
    },
    {
      icon: Layers,
      titleKey: "features.windows_assets.title",
      descriptionKey: "features.windows_assets.description",
      href: "#windows",
    },
    {
      icon: AppWindow,
      titleKey: "features.pwa_ready.title",
      descriptionKey: "features.pwa_ready.description",
      href: "#manifest",
    },
    {
      icon: FolderTree,
      titleKey: "features.organized_zip.title",
      descriptionKey: "features.organized_zip.description",
      href: "#files",
    },
  ];

  return (
    <motion.section
      id="features"
      className="px-4 py-12"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-0">
          <h2 className="sr-only">{t("features.title")}</h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const title = t(feature.titleKey);
            const desc = t(feature.descriptionKey);
            const descId = `feature-desc-${idx}`;
            return (
              <a
                key={feature.titleKey}
                href={feature.href}
                aria-label={`${title}: ${desc}`}
                aria-describedby={descId}
                className="group rounded-xl bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.28)] focus:outline-none focus-visible-ring"
                onClick={() => {
                  try { trackEvent("feature_card_click", { key: feature.titleKey, href: feature.href, position: idx }); } catch { /* noop */ }
                }}
              >
                <div className="relative group flex h-full w-full min-h-[148px] flex-col items-center gap-2.5 rounded-[11px] bg-black/50 p-4 text-center shadow-[0_10px_28px_-16px_rgba(0,0,0,0.4)] md:p-6 motion-safe:transform motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out group-hover:-translate-y-0.5 motion-safe:group-hover:scale-[1.01] backdrop-blur-sm md:backdrop-blur-md backdrop-saturate-150 backdrop-brightness-110 backdrop-contrast-110 overflow-hidden supports-[backdrop-filter:none]:bg-black/45">
                  <BackgroundReflection variant="cards" />
                  <div className="inline-flex rounded-lg bg-primary/90 p-3 shadow-sm ring-1 ring-white/10 transition-colors group-hover:bg-primary group-focus-visible:bg-primary">
                    <Icon className="h-6 w-6 text-primary-foreground drop-shadow-[0_1px_8px_rgba(249,115,22,0.22)]" aria-hidden="true" />
                  </div>
                  <h3 className="text-[18px] font-semibold leading-snug text-foreground md:text-[20px]">
                    {title}
                  </h3>
                  <p id={descId} className="max-w-prose line-clamp-2 md:line-clamp-3 text-[14px] leading-relaxed text-muted-foreground md:text-[15px] md:text-center">
                    {desc}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;

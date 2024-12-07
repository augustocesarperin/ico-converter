import { motion, Variants } from "framer-motion";
import { ImageDown, Layers, FolderTree, AppWindow } from "lucide-react";
import { useTranslation } from "react-i18next";

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
      className="px-4 py-20"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <a
                key={feature.titleKey}
                href={feature.href}
                className="rounded-xl bg-gradient-to-br from-orange-500/25 to-transparent via-transparent p-[1px] backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_28px_-10px_rgba(249,115,22,0.28)]"
              >
                <div className="flex h-full w-full flex-col items-center gap-3 rounded-[11px] bg-black/50 p-6 text-center md:p-6">
                  <div className="inline-flex rounded-lg bg-primary/90 p-3 shadow-sm">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold leading-snug text-foreground md:text-xl">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="max-w-prose line-clamp-2 text-sm leading-relaxed text-muted-foreground md:text-base md:text-center">
                    {t(feature.descriptionKey)}
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

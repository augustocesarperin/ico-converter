import { Gauge, FileDown, Grid3x3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, Variants } from 'framer-motion';

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Gauge,
      titleKey: "features.fast_processing.title",
      descriptionKey: "features.fast_processing.description"
    },
    {
      icon: Grid3x3,
      titleKey: "features.resolutions.title",
      descriptionKey: "features.resolutions.description"
    },
    {
      icon: FileDown,
      titleKey: "features.download.title",
      descriptionKey: "features.download.description"
    }
  ];

  return (
    <motion.section 
      id="features" 
      className="py-20 px-4"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto max-w-6xl">
        <div 
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('features.title')}</h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" 
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.titleKey}
                className="bg-gradient-to-br from-orange-500/25 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_28px_-10px_rgba(249,115,22,0.28)]"
              >
                <div className="bg-black/50 rounded-[11px] p-6 md:p-7 h-full w-full text-left md:text-center flex flex-col items-start md:items-center gap-3">
                  <div className="inline-flex p-3 rounded-lg bg-primary/90 shadow-sm">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground leading-snug">{t(feature.titleKey)}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-prose md:text-center">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;

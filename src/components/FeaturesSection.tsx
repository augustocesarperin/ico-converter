import { Zap, Shield, Download, Layers } from 'lucide-react';
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
      icon: Zap,
      titleKey: "features.fast_processing.title",
      descriptionKey: "features.fast_processing.description"
    },
    {
      icon: Layers,
      titleKey: "features.resolutions.title",
      descriptionKey: "features.resolutions.description"
    },
    {
      icon: Download,
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
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-foreground mb-4">{t('features.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8" 
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.titleKey}
                className="bg-gradient-to-br from-orange-500/20 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)]"
              >
                <div className="bg-black/50 rounded-[11px] p-6 h-full w-full text-center space-y-4">
                  <div className="inline-block p-3 bg-primary rounded-lg">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t(feature.descriptionKey)}</p>
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

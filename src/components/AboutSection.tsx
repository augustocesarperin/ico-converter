import { motion, Variants } from 'framer-motion';
import { useTranslation } from "react-i18next";

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

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <motion.section 
      id="about" 
      className="py-20 px-4"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div
        className="container mx-auto max-w-4xl text-center"
      >
        <div className="space-y-12">
          <div 
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('about.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('about.description')}
            </p>
          </div>

          <div 
            className="grid md:grid-cols-3 gap-8"
          >
            <div
              className="bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)]"
            >
              <div className="bg-black/50 rounded-[11px] p-6 h-full w-full">
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('about.free.title')}</h3>
                <p className="text-muted-foreground">{t('about.free.description')}</p>
              </div>
            </div>
            
            <div 
              className="bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)]"
            >
              <div className="bg-black/50 rounded-[11px] p-6 h-full w-full">
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('about.open_source.title')}</h3>
                <p className="text-muted-foreground">{t('about.open_source.description')}</p>
              </div>
            </div>
            
            <div 
              className="bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)]"
            >
              <div className="bg-black/50 rounded-[11px] p-6 h-full w-full">
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('about.privacy.title')}</h3>
                <p className="text-muted-foreground">{t('about.privacy.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default AboutSection;

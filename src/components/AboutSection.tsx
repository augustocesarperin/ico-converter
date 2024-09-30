import { motion, Variants } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { Github, Shield } from 'lucide-react';

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
      <div className="container mx-auto max-w-5xl text-center">
        <div className="space-y-12">
          <div 
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('about.title')}</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('about.description')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 text-left">
            {[{
              title: t('about.open_source.title'),
              desc: t('about.open_source.description'),
              icon: Github
            }, {
              title: t('about.privacy.title'), 
              desc: t('about.privacy.description'),
              icon: Shield
            }].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.28)]">
                <div className="bg-black/50 rounded-[11px] h-full w-full p-4 md:p-5 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <item.icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 leading-snug">{item.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default AboutSection;

import { motion, Variants } from "framer-motion";
import { Github, Shield } from "lucide-react";
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

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <motion.section
      id="about"
      className="px-4 py-20"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto max-w-5xl text-center">
        <div className="space-y-12">
          <div>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              {t("about.title")}
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t("about.description")}
            </p>
          </div>

          <div className="grid gap-6 text-left sm:grid-cols-2 md:gap-8 lg:grid-cols-2">
            {[
              {
                title: t("about.open_source.title"),
                desc: t("about.open_source.description"),
                icon: Github,
              },
              {
                title: t("about.privacy.title"),
                desc: t("about.privacy.description"),
                icon: Shield,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.28)]"
              >
                <div className="flex h-full w-full items-center gap-4 rounded-[11px] bg-black/50 p-4 md:p-5">
                  <div className="flex-shrink-0">
                    <item.icon className="h-8 w-8 text-primary md:h-10 md:w-10" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="mb-1 text-base font-semibold leading-snug text-foreground md:text-lg">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {item.desc}
                    </p>
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

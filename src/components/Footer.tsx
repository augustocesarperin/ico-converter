import { Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-transparent mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {t('footer.copyright')}
          </p>
          <a
            href="https://github.com/augustocesarperin/ico-converter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

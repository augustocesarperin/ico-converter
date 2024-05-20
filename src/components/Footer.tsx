import { Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-transparent mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm">
            {t('footer.copyright', { year: 2024 })}
          </p>
          <a
            href="https://github.com/GutoCode/IcoForge"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-xs hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>{t('footer.source_code')}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

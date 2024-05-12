import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Usa o backend para carregar traduções
  .use(Backend)
  // Detecta o idioma do usuário
  .use(LanguageDetector)
  // Passa a instância do i18n para o react-i18next
  .use(initReactI18next)
  // Inicializa o i18next
  .init({
    // Idioma padrão
    fallbackLng: 'en',
    // Idiomas suportados
    supportedLngs: ['pt', 'en'],
    // Configurações de depuração
    debug: true,
    interpolation: {
      escapeValue: false, // O React já protege contra XSS
    },
    backend: {
      // Caminho para os arquivos de tradução
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n; 
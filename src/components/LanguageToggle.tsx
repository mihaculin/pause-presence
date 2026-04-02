import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggle = () => {
    i18n.changeLanguage(currentLang === 'en' ? 'ro' : 'en');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-accent"
    >
      <Globe className="w-4 h-4" />
      {currentLang === 'en' ? 'EN' : 'RO'}
    </button>
  );
};

export default LanguageToggle;

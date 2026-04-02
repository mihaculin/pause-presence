import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface DisclaimerPageProps {
  onAgree: () => void;
}

const DisclaimerPage = ({ onAgree }: DisclaimerPageProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        className="max-w-md w-full flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            {t('disclaimer.title')}
          </h1>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <p className="text-foreground/80 leading-relaxed text-base">
            {t('disclaimer.text')}
          </p>
        </div>

        <Button variant="pulz" size="lg" className="w-full h-14 text-base" onClick={onAgree}>
          {t('disclaimer.agree')}
        </Button>
      </motion.div>
    </div>
  );
};

export default DisclaimerPage;

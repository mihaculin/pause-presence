import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LanguageToggle from '@/components/LanguageToggle';
import { Activity, Flame, Wind } from 'lucide-react';

interface DashboardPageProps {
  userName: string;
}

const DashboardPage = ({ userName }: DashboardPageProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-28">
      <div className="max-w-md mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              {t('dashboard.greeting', { name: userName })}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t('dashboard.todayStatus')}</p>
          </div>
          <LanguageToggle />
        </div>

        {/* Mood check-in */}
        <Card className="p-5 rounded-2xl border-border bg-card">
          <div className="flex gap-3 justify-center">
            {['😊', '😐', '😟', '😢', '😤'].map(emoji => (
              <button key={emoji} className="text-3xl hover:scale-125 transition-transform p-1">
                {emoji}
              </button>
            ))}
          </div>
        </Card>

        {/* Biomarker card */}
        <Card className="p-5 rounded-2xl border-border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('dashboard.biomarkers')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'BPM',      value: '--'   },
              { label: 'Temp',     value: '--°C' },
              { label: 'Sweat',    value: '--'   },
              { label: 'Movement', value: '--'   },
            ].map(item => (
              <div key={item.label} className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">{t('dashboard.connectGarmin')}</p>
        </Card>

        {/* Streak */}
        <Card className="p-5 rounded-2xl border-border bg-accent/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-display font-semibold text-foreground">0</p>
            <p className="text-sm text-muted-foreground">{t('dashboard.streak')}</p>
          </div>
        </Card>

        {/* Pause button */}
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button variant="pulz" size="lg" className="w-full h-16 text-lg gap-3">
            <Wind className="w-6 h-6" />
            {t('dashboard.needPause')}
          </Button>
        </motion.div>

        {/* Recent episodes */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('dashboard.recentEpisodes')}</h3>
          <Card className="p-6 rounded-2xl border-border bg-card text-center">
            <p className="text-muted-foreground text-sm">{t('dashboard.noEpisodes')}</p>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;

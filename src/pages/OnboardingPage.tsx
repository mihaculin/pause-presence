import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import BreathingCircle from '@/components/BreathingCircle';
import { ArrowLeft, Watch, Bell, Heart, Sparkles } from 'lucide-react';

interface OnboardingData {
  name: string;
  age: string;
  language: string;
  challenge: string;
  triggers: string[];
  goals: string[];
  emergencyName: string;
  emergencyPhone: string;
  notifications: { checkins: boolean; episodes: boolean; summary: boolean };
}

interface OnboardingPageProps {
  onComplete: (data: OnboardingData) => void;
}

const TOTAL_STEPS = 8;

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '', age: '', language: i18n.language, challenge: '', triggers: [], goals: [],
    emergencyName: '', emergencyPhone: '',
    notifications: { checkins: true, episodes: true, summary: true },
  });

  const next = () => step < TOTAL_STEPS - 1 ? setStep(step + 1) : onComplete(data);
  const back = () => step > 0 && setStep(step - 1);

  const toggleTrigger = (trigger: string) => {
    setData(d => ({
      ...d,
      triggers: d.triggers.includes(trigger)
        ? d.triggers.filter(t => t !== trigger)
        : [...d.triggers, trigger],
    }));
  };

  const toggleGoal = (goal: string) => {
    setData(d => ({
      ...d,
      goals: d.goals.includes(goal)
        ? d.goals.filter(g => g !== goal)
        : [...d.goals, goal],
    }));
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const OptionChip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
        selected
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-secondary text-secondary-foreground hover:bg-accent'
      }`}
    >
      {label}
    </button>
  );

  const ProgressBar = () => (
    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full"
        animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center gap-8 text-center">
            <BreathingCircle size={160} />
            <div className="space-y-3">
              <h1 className="text-3xl font-display font-semibold text-foreground">
                {t('onboarding.welcome.title')}
              </h1>
              <p className="text-muted-foreground text-lg">{t('onboarding.welcome.subtitle')}</p>
            </div>
            <Button variant="pulz" size="lg" className="w-full h-14 text-base" onClick={next}>
              {t('onboarding.welcome.begin')}
            </Button>
          </div>
        );

      case 1: // Personal
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.personal.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.personal.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t('onboarding.personal.name')}</label>
                <Input
                  placeholder={t('onboarding.personal.namePlaceholder')}
                  value={data.name}
                  onChange={e => setData({ ...data, name: e.target.value })}
                  className="h-12 rounded-xl bg-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t('onboarding.personal.age')}</label>
                <Input
                  type="number"
                  placeholder={t('onboarding.personal.agePlaceholder')}
                  value={data.age}
                  onChange={e => setData({ ...data, age: e.target.value })}
                  className="h-12 rounded-xl bg-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t('onboarding.personal.language')}</label>
                <div className="flex gap-3">
                  <OptionChip label="English" selected={data.language === 'en'} onClick={() => { setData({ ...data, language: 'en' }); i18n.changeLanguage('en'); }} />
                  <OptionChip label="Română" selected={data.language === 'ro'} onClick={() => { setData({ ...data, language: 'ro' }); i18n.changeLanguage('ro'); }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Assessment
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.assessment.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.assessment.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground block">{t('onboarding.assessment.challenge')}</label>
              <div className="flex flex-wrap gap-2">
                <OptionChip label={t('onboarding.assessment.bingeEating')} selected={data.challenge === 'binge'} onClick={() => setData({ ...data, challenge: 'binge' })} />
                <OptionChip label={t('onboarding.assessment.emotionalEating')} selected={data.challenge === 'emotional'} onClick={() => setData({ ...data, challenge: 'emotional' })} />
                <OptionChip label={t('onboarding.assessment.both')} selected={data.challenge === 'both'} onClick={() => setData({ ...data, challenge: 'both' })} />
              </div>
              <label className="text-sm font-medium text-foreground block mt-4">{t('onboarding.assessment.triggers')}</label>
              <div className="flex flex-wrap gap-2">
                {['stress', 'boredom', 'loneliness', 'anxiety', 'other'].map(trigger => (
                  <OptionChip
                    key={trigger}
                    label={t(`onboarding.assessment.${trigger}`)}
                    selected={data.triggers.includes(trigger)}
                    onClick={() => toggleTrigger(trigger)}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Goals
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.goals.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.goals.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['awareness', 'patterns', 'therapySupport', 'allAbove'].map(goal => (
                <OptionChip
                  key={goal}
                  label={t(`onboarding.goals.${goal}`)}
                  selected={data.goals.includes(goal)}
                  onClick={() => toggleGoal(goal)}
                />
              ))}
            </div>
          </div>
        );

      case 4: // Emergency contact
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.emergency.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.emergency.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t('onboarding.emergency.contactName')}</label>
                <Input
                  placeholder={t('onboarding.emergency.contactNamePlaceholder')}
                  value={data.emergencyName}
                  onChange={e => setData({ ...data, emergencyName: e.target.value })}
                  className="h-12 rounded-xl bg-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t('onboarding.emergency.contactPhone')}</label>
                <Input
                  placeholder={t('onboarding.emergency.contactPhonePlaceholder')}
                  value={data.emergencyPhone}
                  onChange={e => setData({ ...data, emergencyPhone: e.target.value })}
                  className="h-12 rounded-xl bg-card border-border"
                />
              </div>
            </div>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={next}>
              {t('onboarding.emergency.skip')}
            </Button>
          </div>
        );

      case 5: // Garmin
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mx-auto">
              <Watch className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.garmin.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.garmin.subtitle')}</p>
            </div>
            <Button variant="pulz" size="lg" className="w-full h-14 text-base">
              {t('onboarding.garmin.connect')}
            </Button>
            <p className="text-sm text-muted-foreground">{t('onboarding.garmin.description')}</p>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={next}>
              {t('onboarding.garmin.skip')}
            </Button>
          </div>
        );

      case 6: // Notifications
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Bell className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.notifications.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.notifications.subtitle')}</p>
            </div>
            <div className="space-y-4">
              {[
                { key: 'checkins', label: t('onboarding.notifications.gentleCheckins') },
                { key: 'episodes', label: t('onboarding.notifications.episodeAlerts') },
                { key: 'summary', label: t('onboarding.notifications.dailySummary') },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <Switch
                    checked={data.notifications[item.key as keyof typeof data.notifications]}
                    onCheckedChange={checked =>
                      setData({ ...data, notifications: { ...data.notifications, [item.key]: checked } })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 7: // Complete
        return (
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-semibold">{t('onboarding.complete.title')}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">{t('onboarding.complete.subtitle')}</p>
            </div>
            <Button variant="pulz" size="lg" className="w-full h-14 text-base" onClick={next}>
              {t('onboarding.complete.enter')}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="mb-6 space-y-4">
          <button onClick={back} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('onboarding.back')}
          </button>
          <ProgressBar />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {step > 0 && step < TOTAL_STEPS - 1 && step !== 4 && step !== 5 && (
        <div className="mt-6 max-w-md w-full mx-auto">
          <Button variant="pulz" size="lg" className="w-full h-14 text-base" onClick={next}>
            {t('onboarding.next')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;

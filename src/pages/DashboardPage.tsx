import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LanguageToggle from '@/components/LanguageToggle';
import BreathingCircle from '@/components/BreathingCircle';
import FAB from '@/components/FAB';
import QuickNoteSheet from '@/components/QuickNoteSheet';
import EpisodeLogSheet from '@/components/EpisodeLogSheet';
import { useSupabaseClient } from '@/hooks/useSupabase';
import { Activity, Flame, Wind, Star } from 'lucide-react';
import type { Note } from '@/types/database';

interface DashboardPageProps {
  userName: string;
}

const DashboardPage = ({ userName }: DashboardPageProps) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [noteOpen, setNoteOpen] = useState(false);
  const [episodeOpen, setEpisodeOpen] = useState(false);

  // Fetch important notes
  const { data: importantNotes = [] } = useQuery<Note[]>({
    queryKey: ['important-notes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('clerk_id', user.id)
          .eq('is_important', true)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) return [];
        return (data as Note[]) ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

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

        {/* Important notes */}
        {importantNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Star size={12} className="fill-current" style={{ color: 'hsl(40, 85%, 50%)' }} />
              {t('notes.importantNotes')}
            </h3>
            {importantNotes.map(note => (
              <div
                key={note.id}
                className="px-4 py-3 rounded-2xl border text-sm text-foreground leading-relaxed"
                style={{
                  background: 'hsl(45, 90%, 97%)',
                  borderColor: 'hsl(45, 80%, 78%)',
                }}
              >
                {note.content}
              </div>
            ))}
          </motion.div>
        )}

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
              { label: 'BPM',      value: '--',   icon: Activity },
              { label: 'Temp',     value: '--°C', icon: Activity },
              { label: 'Sweat',    value: '--',   icon: Activity },
              { label: 'Movement', value: '--',   icon: Activity },
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

      {/* FAB */}
      <FAB
        onAddNote={() => setNoteOpen(true)}
        onLogEpisode={() => setEpisodeOpen(true)}
      />

      {/* Sheets */}
      <QuickNoteSheet open={noteOpen} onClose={() => setNoteOpen(false)} />
      <EpisodeLogSheet open={episodeOpen} onClose={() => setEpisodeOpen(false)} />
    </div>
  );
};

export default DashboardPage;

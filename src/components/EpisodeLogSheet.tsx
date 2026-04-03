import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import EmotionBubbles from '@/components/EmotionBubbles';
import { useSupabaseClient } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type LogStatus = 'episode' | 'unsure' | 'avoided' | 'other'

interface FormData {
  logStatus:       LogStatus | null
  logStatusOther:  string
  emotions:        string[]
  emotionOther:    string
  whatTriggered:   string
  whatIWasDoing:   string
  intensity:       number
  whatHelped:      string
  additionalNotes: string
}

const TOTAL_STEPS = 4

const defaultForm = (): FormData => ({
  logStatus:       null,
  logStatusOther:  '',
  emotions:        [],
  emotionOther:    '',
  whatTriggered:   '',
  whatIWasDoing:   '',
  intensity:       5,
  whatHelped:      '',
  additionalNotes: '',
})

interface EpisodeLogSheetProps {
  open: boolean
  onClose: () => void
}

export default function EpisodeLogSheet({ open, onClose }: EpisodeLogSheetProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(defaultForm())
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setStep(0)
    setForm(defaultForm())
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const canProceed = (): boolean => {
    if (step === 0) return form.logStatus !== null
    return true
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const allEmotions = [
        ...form.emotions,
        ...(form.emotions.includes('other') && form.emotionOther.trim()
          ? [`other: ${form.emotionOther.trim()}`]
          : []),
      ].filter(e => e !== 'other' || form.emotionOther.trim() === '')

      const { error } = await supabase.from('episodes').insert({
        clerk_id:         user.id,
        episode_type:     'emotional', // manual logs default; detection refines later
        was_prevented:    form.logStatus === 'avoided',
        log_status:       form.logStatus,
        log_status_other: form.logStatusOther || null,
        emotions:         allEmotions,
        intensity:        form.intensity,
        what_triggered:   form.whatTriggered || null,
        what_i_was_doing: form.whatIWasDoing || null,
        what_helped:      form.whatHelped || null,
        notes:            form.additionalNotes || null,
      })
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['episodes', user.id] })
      toast.success(t('episodeLog.saved'))
      handleClose()
    } catch {
      toast.error(t('episodeLog.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const statusOptions: { value: LogStatus; label: string }[] = [
    { value: 'episode', label: t('episodeLog.status.episode') },
    { value: 'unsure',  label: t('episodeLog.status.unsure')  },
    { value: 'avoided', label: t('episodeLog.status.avoided') },
    { value: 'other',   label: t('episodeLog.status.other')   },
  ]

  const slideVariants = {
    enter:  (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: -dir * 40, opacity: 0 }),
  }

  const [direction, setDirection] = useState(1)

  const goNext = () => { setDirection(1); handleNext() }
  const goBack = () => { setDirection(-1); handleBack() }

  return (
    <Drawer open={open} onOpenChange={o => !o && handleClose()}>
      <DrawerContent className="px-5 pb-8 max-h-[92vh] overflow-hidden flex flex-col">
        <DrawerHeader className="px-0 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="font-display text-xl text-foreground">
              {t('episodeLog.title')}
            </DrawerTitle>
            <span className="text-xs text-muted-foreground">
              {t('episodeLog.step', { current: step + 1, total: TOTAL_STEPS })}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'hsl(170, 38%, 55%)' }}
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </DrawerHeader>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-5 pb-4"
            >
              {/* ── Step 0: Status ─────────────────────────────────────────── */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('episodeLog.status.label')}
                  </p>
                  <div className="space-y-3">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logStatus: opt.value }))}
                        className={cn(
                          'w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200',
                          form.logStatus === opt.value
                            ? 'border-[hsl(170,38%,55%)] text-foreground'
                            : 'border-border text-muted-foreground hover:border-[hsl(170,38%,70%)]'
                        )}
                        style={form.logStatus === opt.value ? { background: 'hsl(170,38%,96%)' } : {}}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.logStatus === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        value={form.logStatusOther}
                        onChange={e => setForm(f => ({ ...f, logStatusOther: e.target.value }))}
                        placeholder={t('episodeLog.status.otherPlaceholder')}
                        className="h-12 rounded-xl bg-card border-border"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Step 1: Emotions ───────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('episodeLog.emotions.label')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('episodeLog.emotions.sublabel')}
                    </p>
                  </div>
                  <EmotionBubbles
                    selected={form.emotions}
                    onChange={emotions => setForm(f => ({ ...f, emotions }))}
                  />
                  {form.emotions.includes('other') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        value={form.emotionOther}
                        onChange={e => setForm(f => ({ ...f, emotionOther: e.target.value }))}
                        placeholder={t('episodeLog.emotions.otherPlaceholder')}
                        className="h-12 rounded-xl bg-card border-border"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Step 2: Context ────────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t('episodeLog.trigger.label')}
                    </label>
                    <Textarea
                      value={form.whatTriggered}
                      onChange={e => setForm(f => ({ ...f, whatTriggered: e.target.value }))}
                      placeholder={t('episodeLog.trigger.placeholder')}
                      className="rounded-2xl bg-card border-border resize-none min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t('episodeLog.before.label')}
                    </label>
                    <Textarea
                      value={form.whatIWasDoing}
                      onChange={e => setForm(f => ({ ...f, whatIWasDoing: e.target.value }))}
                      placeholder={t('episodeLog.before.placeholder')}
                      className="rounded-2xl bg-card border-border resize-none min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {/* ── Step 3: Intensity + Helped + Notes ─────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-foreground">
                        {t('episodeLog.intensity.label')}
                      </label>
                      <span
                        className="text-2xl font-display font-semibold"
                        style={{ color: 'hsl(170, 38%, 45%)' }}
                      >
                        {form.intensity}
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[form.intensity]}
                      onValueChange={([v]) => setForm(f => ({ ...f, intensity: v }))}
                      className="my-2"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{t('episodeLog.intensity.hint')}</span>
                      <span className="text-xs text-muted-foreground">{t('episodeLog.intensity.hintHigh')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t('episodeLog.helped.label')}
                    </label>
                    <Textarea
                      value={form.whatHelped}
                      onChange={e => setForm(f => ({ ...f, whatHelped: e.target.value }))}
                      placeholder={t('episodeLog.helped.placeholder')}
                      className="rounded-2xl bg-card border-border resize-none min-h-[90px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t('episodeLog.additionalNotes.label')}
                    </label>
                    <Textarea
                      value={form.additionalNotes}
                      onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))}
                      placeholder={t('episodeLog.additionalNotes.placeholder')}
                      className="rounded-2xl bg-card border-border resize-none min-h-[90px]"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 flex-shrink-0">
          {step > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-5 rounded-full border-border"
              onClick={goBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button
              variant="pulz"
              size="lg"
              className="flex-1 h-14 text-base"
              onClick={goNext}
              disabled={!canProceed()}
            >
              {t('episodeLog.next')}
            </Button>
          ) : (
            <Button
              variant="pulz"
              size="lg"
              className="flex-1 h-14 text-base"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '…' : t('episodeLog.save')}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

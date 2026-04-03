import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface EmotionConfig {
  id: string
  labelKey: string
  bg: string
  selectedBg: string
  textColor: string
  shape: string
  paddingX: number
  paddingY: number
  fontSize: number
  mt: number
}

const EMOTIONS: EmotionConfig[] = [
  {
    id: 'anxious',
    labelKey: 'episodeLog.emotions.anxious',
    bg: '#EDE8F5',
    selectedBg: '#C8B4E8',
    textColor: '#3D3050',
    shape: 'rounded-full',
    paddingX: 20,
    paddingY: 12,
    fontSize: 14,
    mt: 0,
  },
  {
    id: 'sad',
    labelKey: 'episodeLog.emotions.sad',
    bg: '#D8E8F5',
    selectedBg: '#A0C5E8',
    textColor: '#1E3A50',
    shape: 'rounded-full',
    paddingX: 14,
    paddingY: 10,
    fontSize: 13,
    mt: 28,
  },
  {
    id: 'lonely',
    labelKey: 'episodeLog.emotions.lonely',
    bg: '#F5E0E0',
    selectedBg: '#E8B0B0',
    textColor: '#501E1E',
    shape: 'rounded-2xl',
    paddingX: 20,
    paddingY: 12,
    fontSize: 14,
    mt: 8,
  },
  {
    id: 'bored',
    labelKey: 'episodeLog.emotions.bored',
    bg: '#F5ECD5',
    selectedBg: '#E8CF98',
    textColor: '#4A3C10',
    shape: 'rounded-full',
    paddingX: 16,
    paddingY: 9,
    fontSize: 13,
    mt: 38,
  },
  {
    id: 'stressed',
    labelKey: 'episodeLog.emotions.stressed',
    bg: '#F5DDD4',
    selectedBg: '#E8B89C',
    textColor: '#50281E',
    shape: 'rounded-2xl',
    paddingX: 24,
    paddingY: 14,
    fontSize: 15,
    mt: 4,
  },
  {
    id: 'overwhelmed',
    labelKey: 'episodeLog.emotions.overwhelmed',
    bg: '#EDD8F0',
    selectedBg: '#D0A0E5',
    textColor: '#3C1E50',
    shape: 'rounded-full',
    paddingX: 18,
    paddingY: 11,
    fontSize: 14,
    mt: 20,
  },
  {
    id: 'happy',
    labelKey: 'episodeLog.emotions.happy',
    bg: '#D8F5E8',
    selectedBg: '#98E5C0',
    textColor: '#1E4A34',
    shape: 'rounded-full',
    paddingX: 20,
    paddingY: 12,
    fontSize: 14,
    mt: 12,
  },
  {
    id: 'angry',
    labelKey: 'episodeLog.emotions.angry',
    bg: '#F5DDD5',
    selectedBg: '#E8A898',
    textColor: '#501E14',
    shape: 'rounded-full',
    paddingX: 16,
    paddingY: 9,
    fontSize: 13,
    mt: 0,
  },
  {
    id: 'other',
    labelKey: 'episodeLog.emotions.other',
    bg: '#DDE8D8',
    selectedBg: '#B0C8A8',
    textColor: '#243020',
    shape: 'rounded-2xl',
    paddingX: 18,
    paddingY: 10,
    fontSize: 13,
    mt: 32,
  },
]

interface EmotionBubblesProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function EmotionBubbles({ selected, onChange }: EmotionBubblesProps) {
  const { t } = useTranslation()

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    )
  }

  return (
    <div
      className="rounded-2xl px-3 py-5"
      style={{ background: 'hsl(170, 35%, 96%)' }}
    >
      <div className="flex flex-wrap gap-2.5 justify-start">
        {EMOTIONS.map(e => {
          const isSelected = selected.includes(e.id)
          return (
            <motion.button
              key={e.id}
              type="button"
              onClick={() => toggle(e.id)}
              whileTap={{ scale: 0.92 }}
              animate={{
                boxShadow: isSelected
                  ? `0 0 0 2px ${e.selectedBg}, 0 4px 12px ${e.selectedBg}60`
                  : '0 2px 6px rgba(0,0,0,0.06)',
              }}
              transition={{ duration: 0.18 }}
              style={{
                backgroundColor: isSelected ? e.selectedBg : e.bg,
                color: e.textColor,
                paddingLeft: e.paddingX,
                paddingRight: e.paddingX,
                paddingTop: e.paddingY,
                paddingBottom: e.paddingY,
                fontSize: e.fontSize,
                marginTop: e.mt,
              }}
              className={cn(
                'inline-flex items-center gap-1.5 font-medium transition-colors duration-200',
                e.shape
              )}
            >
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check size={12} strokeWidth={2.5} />
                </motion.span>
              )}
              {t(e.labelKey)}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

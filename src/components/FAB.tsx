import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FABProps {
  onAddNote: () => void
  onLogEpisode: () => void
}

export default function FAB({ onAddNote, onLogEpisode }: FABProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const handleAction = (action: () => void) => {
    setOpen(false)
    // slight delay so the menu closes before the sheet opens
    setTimeout(action, 150)
  }

  const actions = [
    {
      label: t('fab.logEpisode'),
      icon: ClipboardList,
      onClick: () => handleAction(onLogEpisode),
    },
    {
      label: t('fab.addNote'),
      icon: StickyNote,
      onClick: () => handleAction(onAddNote),
    },
  ]

  return (
    <>
      {/* Backdrop to close menu on outside tap */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-5 flex flex-col items-end gap-3 z-50">
        {/* Action buttons */}
        <AnimatePresence>
          {open && actions.map((action, i) => (
            <motion.div
              key={action.label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              {/* Label chip */}
              <div
                className="px-4 py-2 rounded-full text-sm font-medium shadow-md"
                style={{
                  background: 'hsl(170, 35%, 97%)',
                  color: 'hsl(170, 30%, 28%)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                }}
              >
                {action.label}
              </div>

              {/* Icon button */}
              <motion.button
                onClick={action.onClick}
                whileTap={{ scale: 0.92 }}
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: 'linear-gradient(135deg, hsl(170, 38%, 60%), hsl(145, 22%, 68%))',
                  color: 'white',
                }}
              >
                <action.icon size={20} strokeWidth={1.8} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileTap={{ scale: 0.92 }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, hsl(170, 40%, 52%), hsl(145, 24%, 62%))',
            color: 'white',
            boxShadow: '0 4px 20px hsla(170, 40%, 40%, 0.4)',
          }}
          aria-label="Open actions"
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <Plus size={26} strokeWidth={2} />
          </motion.div>
        </motion.button>
      </div>
    </>
  )
}

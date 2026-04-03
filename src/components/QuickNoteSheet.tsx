import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseClient } from '@/hooks/useSupabase';
import { toast } from 'sonner';

interface QuickNoteSheetProps {
  open: boolean
  onClose: () => void
}

export default function QuickNoteSheet({ open, onClose }: QuickNoteSheetProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  const [content, setContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setContent('')
    setIsImportant(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSave = async () => {
    if (!content.trim() || !user?.id) return
    setSaving(true)
    try {
      const { error } = await supabase.from('notes').insert({
        clerk_id:     user.id,
        content:      content.trim(),
        is_important: isImportant,
      })
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['important-notes', user.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', user.id] })
      toast.success(t('notes.saved'))
      handleClose()
    } catch {
      toast.error(t('notes.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={o => !o && handleClose()}>
      <DrawerContent className="px-5 pb-8 max-h-[85vh]">
        <DrawerHeader className="px-0 pt-2 pb-4">
          <DrawerTitle className="font-display text-xl text-foreground">
            {t('notes.title')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-5">
          {/* Text area */}
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('notes.placeholder')}
            className="min-h-[140px] rounded-2xl bg-card border-border text-base resize-none leading-relaxed"
            autoFocus
          />

          {/* Important toggle */}
          <button
            type="button"
            onClick={() => setIsImportant(v => !v)}
            className="flex items-center gap-3 w-full p-4 rounded-2xl border transition-all duration-200"
            style={{
              background: isImportant ? 'hsl(45, 90%, 96%)' : 'transparent',
              borderColor: isImportant ? 'hsl(45, 80%, 70%)' : 'hsl(var(--border))',
            }}
          >
            <motion.div
              animate={{ scale: isImportant ? 1.15 : 1 }}
              transition={{ duration: 0.18 }}
            >
              <Star
                size={20}
                strokeWidth={1.8}
                style={{
                  color: isImportant ? 'hsl(40, 85%, 50%)' : 'hsl(var(--muted-foreground))',
                  fill: isImportant ? 'hsl(40, 85%, 50%)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              />
            </motion.div>
            <span
              className="text-sm font-medium transition-colors"
              style={{ color: isImportant ? 'hsl(40, 60%, 35%)' : 'hsl(var(--muted-foreground))' }}
            >
              {t('notes.markImportant')}
            </span>
          </button>

          {/* Save button */}
          <Button
            variant="pulz"
            size="lg"
            className="w-full h-14 text-base"
            onClick={handleSave}
            disabled={!content.trim() || saving}
          >
            {saving ? '…' : t('notes.save')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

import { useState } from 'react';
import FAB from './FAB';
import QuickNoteSheet from './QuickNoteSheet';
import EpisodeLogSheet from './EpisodeLogSheet';

/**
 * Self-contained FAB + sheets.
 * Rendered at the layout level (Index.tsx) so it is independent of
 * any individual page's render cycle.
 */
export default function FloatingActionButton() {
  const [noteOpen, setNoteOpen] = useState(false);
  const [episodeOpen, setEpisodeOpen] = useState(false);

  return (
    <>
      <FAB
        onAddNote={() => setNoteOpen(true)}
        onLogEpisode={() => setEpisodeOpen(true)}
      />
      <QuickNoteSheet open={noteOpen} onClose={() => setNoteOpen(false)} />
      <EpisodeLogSheet open={episodeOpen} onClose={() => setEpisodeOpen(false)} />
    </>
  );
}

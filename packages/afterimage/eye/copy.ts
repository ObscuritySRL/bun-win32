// Every word Afterimage says, in one place, in one voice: quiet, observant, brief. Technical only
// in the Under the hood panel, where people asked for it.

export const copy = {
  copied: 'Copied',
  copiedRegion: 'Copied — region',
  empty: 'Nothing to look back on yet.',
  emptyDetail: 'I start remembering the moment I wake up.',
  firstRun: 'Afterimage is watching — only into memory.',
  firstRunDetail: (hotkey: string) => `Press ${hotkey} to look back.`,
  forgetArmed: 'Press again to forget everything.',
  forgotten: 'Forgotten.',
  gapLocked: 'Locked',
  gapPaused: 'Paused',
  gapUnavailable: 'Out of sight',
  find: 'Find',
  findCount: (count: number) => `${count} ${count === 1 ? 'moment' : 'moments'} · ↑ ↓ to step · Enter to stay`,
  findGoTo: (clock: string) => `Enter to go to ${clock}`,
  findHint: 'a word you saw, or a time like 14:32',
  findNone: (span: string) => `Nothing like that in the last ${span}.`,
  findUnavailable: 'Reading words needs a Windows OCR language.',
  hints: '← → step   Shift moments   type to find   Space full size   drag a region   Ctrl+C copy   ? details',
  live: 'Now',
  paused: 'Paused',
  pausedDetail: 'Your screen is your own until you resume.',
  protected: 'Some of this moment was protected.',
  regionHint: 'Steps follow this region · Esc to clear',
  saved: 'Saved to Pictures',
  tooltip: (held: string) => `Afterimage — holding the last ${held}`,
  tooltipPaused: 'Afterimage — paused',
  unavailable: 'I can’t see this screen right now.',
  unavailableDetail: 'It comes back on its own.',
  underTheHood: 'Under the hood',
} as const;

/** "38 min", "1 h 12 min", "45 s" — how long a stretch of memory is. */
export function formatSpan(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1_000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}

/** "212 MB", "1.4 GB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 0x4000_0000) return `${(bytes / 0x4000_0000).toFixed(1)} GB`;
  return `${Math.round(bytes / 0x10_0000)} MB`;
}

/** Box-drawing characters for `CharTerm.box`, by style. */
export const BOX = {
  double: { bl: '╚', br: '╝', h: '═', tl: '╔', tr: '╗', v: '║' },
  rounded: { bl: '╰', br: '╯', h: '─', tl: '╭', tr: '╮', v: '│' },
  sharp: { bl: '└', br: '┘', h: '─', tl: '┌', tr: '┐', v: '│' },
} as const;

export type BoxStyle = keyof typeof BOX;

/** Block and shading characters. */
export const BLOCK = {
  dark: '▓',
  full: '█',
  left: '▌',
  light: '░',
  lower: '▄',
  medium: '▒',
  right: '▐',
  upper: '▀',
} as const;

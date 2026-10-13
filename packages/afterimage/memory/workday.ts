// "Workday": the stage's scripted desktop — forty seconds of an ordinary afternoon, drawn in DIPs
// as a function of virtual time. A document being typed, a chat where a door code is sent and then
// deleted, a build log that scrolls its one error out of sight, a preview that never stops moving,
// and a verification code that appears for five seconds and is gone. All names and text are made up.

import type { Color, Painter, TextOptions } from '../shared/painter';

const fonts = {
  body: { family: 'Segoe UI Variable Text', size: 15 },
  bubble: { family: 'Segoe UI Variable Text', size: 14 },
  caption: { family: 'Segoe UI Variable Small', size: 12 },
  glyph: { family: 'Segoe Fluent Icons', size: 10 },
  heading: { family: 'Segoe UI Variable Display', size: 22, weight: 600 },
  mono: { family: 'Cascadia Mono', size: 13 },
  title: { family: 'Segoe UI Variable Text', size: 12 },
} as const satisfies Record<string, TextOptions>;

const noteText =
  'Ship the beta to the first hundred testers on Thursday. Keep onboarding to three screens: what it does, the one shortcut that matters, and a calm promise about privacy — nothing leaves the machine.\n\nOpen questions: do we default to 512 MB? Should the timeline remember gaps when the screen is locked? (Yes. It should say so plainly.)';

const messages: { at: number; deletedAt?: number; mine: boolean; text: string }[] = [
  { at: -60_000, mine: false, text: 'Are we still on for the demo at 3?' },
  { at: -50_000, mine: true, text: 'Yes — dialing in from the studio.' },
  { at: 4_000, deletedAt: 16_000, mine: false, text: 'Perfect. Door code is 7149 if you swing by.' },
  { at: 21_000, mine: false, text: 'Can you send the deck when you get a sec?' },
  { at: 27_000, mine: true, text: 'On it — two minutes.' },
];

const logLines = [
  '[14:30:01] watching src/ for changes',
  '[14:30:01] compiling 128 modules…',
  '[14:30:02] ✓ bundled in 412 ms',
  '[14:30:04] src/timeline.ts changed',
  '[14:30:04] ✓ rebuilt in 38 ms',
  '[14:30:07] tests  57 passed',
  '[14:30:09] src/view.ts changed',
  '[14:30:09] ✓ rebuilt in 41 ms',
  '[14:30:12] src/boot.ts changed',
  '[14:30:12] ✓ rebuilt in 36 ms',
  '[14:30:15] src/theme.ts changed',
  '[14:30:15] ✓ rebuilt in 35 ms',
  '[14:30:17] src/boot.ts changed',
  "✖ error  Cannot find module './config'  (src/boot.ts:12)",
  '[14:30:19] src/boot.ts changed',
  '[14:30:19] ✓ rebuilt in 44 ms',
  '[14:30:21] tests  57 passed',
  '[14:30:23] src/shelf.ts changed',
  '[14:30:23] ✓ rebuilt in 39 ms',
  '[14:30:25] src/shelf.ts changed',
  '[14:30:25] ✓ rebuilt in 37 ms',
  '[14:30:27] tests  58 passed',
  '[14:30:29] src/copy.ts changed',
  '[14:30:29] ✓ rebuilt in 33 ms',
  '[14:30:31] src/copy.ts changed',
  '[14:30:31] ✓ rebuilt in 34 ms',
  '[14:30:33] tests  58 passed',
  '[14:30:35] idle',
];

const dark = {
  border: [1, 1, 1, 0.08],
  surface: [32 / 255, 32 / 255, 32 / 255, 1],
  text: [0.94, 0.94, 0.95, 1],
  textSoft: [0.62, 0.63, 0.66, 1],
} as const satisfies Record<string, Color>;

/** Pointer path for the stage (DIPs), so replays have a ghost cursor to show. */
export function pointerAt(time: number, width: number, height: number): [number, number] {
  const stops: [number, number, number][] = [
    [0, 0.2, 0.3],
    [3_000, 0.25, 0.35],
    [6_000, 0.62, 0.55],
    [10_000, 0.84, 0.86],
    [14_000, 0.66, 0.6],
    [20_000, 0.3, 0.75],
    [28_000, 0.62, 0.62],
    [40_000, 0.4, 0.4],
  ];
  let index = 0;
  while (index < stops.length - 2 && time > stops[index + 1]![0]) index += 1;
  const [fromTime, fromX, fromY] = stops[index]!;
  const [toTime, toX, toY] = stops[index + 1]!;
  const t = Math.min(1, Math.max(0, (time - fromTime) / (toTime - fromTime)));
  const eased = t * t * (3 - 2 * t);
  return [(fromX + (toX - fromX) * eased) * width, (fromY + (toY - fromY) * eased) * height];
}

/** Draw the desktop (minus the wallpaper, which the stage's shader paints first) at `time`. */
export function drawWorkday(painter: Painter, time: number, width: number, height: number, epoch: number): void {
  const taskbar = 48;
  const notes = { height: 560, left: 56, top: 48, width: 820 };
  const chat = { height: 640, left: 920, top: 92, width: 640 };
  const terminal = { height: 360, left: 120, top: height - taskbar - 400, width: 780 };
  const preview = { height: 300, left: width - 500, top: 120, width: 452 };
  drawWindow(painter, preview, 'Preview — ocean.mov', true);
  drawPreview(painter, preview, time);
  drawWindow(painter, notes, 'Launch plan — Notes', false);
  drawNotes(painter, notes, time);
  drawWindow(painter, terminal, 'Terminal', true);
  drawTerminal(painter, terminal, time);
  drawWindow(painter, chat, 'Messages', true);
  drawChat(painter, chat, time);
  drawToast(painter, time, width, height - taskbar);
  drawTaskbar(painter, width, height, taskbar, epoch);
}

function drawChat(painter: Painter, frame: Rectangle, time: number): void {
  const top = frame.top + 40;
  const sidebar = 210;
  painter.fillRectangle(frame.left, top, sidebar, frame.height - 40, [27 / 255, 27 / 255, 29 / 255, 1]);
  const contacts: [string, string, Color][] = [
    ['Maya Chen', 'MC', [0.36, 0.55, 0.95, 1]],
    ['Design crit', 'DC', [0.85, 0.45, 0.6, 1]],
    ['Leo Park', 'LP', [0.35, 0.75, 0.6, 1]],
    ['Book club', 'BC', [0.9, 0.65, 0.3, 1]],
  ];
  contacts.forEach(([name, initials, color], index) => {
    const y = top + 16 + index * 58;
    if (index === 0) painter.fillRoundedRectangle(frame.left + 8, y - 6, sidebar - 16, 52, 6, [1, 1, 1, 0.06]);
    painter.fillEllipse(frame.left + 34, y + 20, 18, 18, color);
    painter.text(initials, { ...fonts.caption, align: 'center', weight: 600 }, frame.left + 16, y + 2, 36, 36, [1, 1, 1, 1]);
    painter.text(name, { ...fonts.title, weight: 600 }, frame.left + 62, y, sidebar - 70, 22, dark.text);
    painter.text(index === 0 ? 'Online' : 'Yesterday', fonts.caption, frame.left + 62, y + 20, sidebar - 70, 18, dark.textSoft);
  });
  const paneLeft = frame.left + sidebar;
  const paneWidth = frame.width - sidebar;
  painter.text('Maya Chen', { ...fonts.title, size: 15, weight: 600 }, paneLeft + 20, top + 10, 300, 28, dark.text);
  painter.fillRectangle(paneLeft, top + 48, paneWidth, 1, [1, 1, 1, 0.06]);
  const visible = messages.filter((message) => message.at <= time);
  let y = top + 72;
  for (const message of visible) {
    const deleted = message.deletedAt !== undefined && time >= message.deletedAt;
    const text = deleted ? 'This message was deleted' : message.text;
    const options: TextOptions = deleted ? { ...fonts.bubble, italic: true } : fonts.bubble;
    const [textWidth] = painter.measure(text, options);
    const bubbleWidth = textWidth + 28;
    const left = message.mine ? paneLeft + paneWidth - 20 - bubbleWidth : paneLeft + 20;
    const fill: Color = message.mine ? [0.19, 0.38, 0.85, 1] : [0.18, 0.18, 0.2, 1];
    painter.fillRoundedRectangle(left, y, bubbleWidth, 36, 12, deleted ? [0.16, 0.16, 0.18, 1] : fill);
    painter.text(text, options, left + 14, y, bubbleWidth, 36, deleted ? dark.textSoft : [0.97, 0.97, 0.98, 1]);
    y += 48;
  }
  const typing = messages.find((message) => !message.mine && message.at > time && message.at - time < 1_600);
  if (typing !== undefined) {
    painter.fillRoundedRectangle(paneLeft + 20, y, 64, 32, 12, [0.18, 0.18, 0.2, 1]);
    for (let dot = 0; dot < 3; dot += 1) {
      const lift = Math.max(0, Math.sin(time / 140 - dot * 0.9)) * 3;
      painter.fillEllipse(paneLeft + 38 + dot * 14, y + 16 - lift, 3.5, 3.5, [0.7, 0.7, 0.74, 1]);
    }
  }
  const inputTop = frame.top + frame.height - 56;
  painter.fillRoundedRectangle(paneLeft + 16, inputTop, paneWidth - 32, 40, 8, [1, 1, 1, 0.06]);
  painter.text('Message Maya', fonts.bubble, paneLeft + 30, inputTop, 300, 40, dark.textSoft);
}

function drawNotes(painter: Painter, frame: Rectangle, time: number): void {
  const left = frame.left + 40;
  const top = frame.top + 72;
  const width = frame.width - 80;
  painter.text('Launch plan', fonts.heading, left, top - 8, width, 34, [0.08, 0.08, 0.1, 1]);
  painter.text('Edited just now', fonts.caption, left, top + 26, width, 18, [0.45, 0.46, 0.5, 1]);
  const typed = Math.max(0, Math.min(noteText.length, Math.floor((time - 1_000) / 70)));
  const text = noteText.slice(0, typed);
  painter.text(text, { ...fonts.body, wrap: true }, left, top + 60, width, frame.height - 150, [0.12, 0.12, 0.14, 1]);
}

function drawPreview(painter: Painter, frame: Rectangle, time: number): void {
  const left = frame.left + 1;
  const top = frame.top + 40;
  const width = frame.width - 2;
  const height = frame.height - 41;
  painter.pushClip(left, top, width, height);
  painter.fillRectangle(left, top, width, height, [0.03, 0.14, 0.24, 1]);
  for (let band = 0; band < 7; band += 1) {
    const phase = time / 900 + band * 0.8;
    const y = top + height * (0.25 + band * 0.1) + Math.sin(phase) * 18;
    painter.fillEllipse(left + width * (0.5 + 0.35 * Math.sin(phase * 0.7 + band)), y, width * 0.55, 22 + band * 3, [0.1 + band * 0.04, 0.35 + band * 0.05, 0.55 + band * 0.04, 0.35]);
  }
  painter.fillEllipse(left + width * 0.78, top + height * 0.24, 34, 34, [1, 0.86, 0.6, 0.85]);
  painter.popClip();
  const progress = (time % 30_000) / 30_000;
  painter.fillRectangle(left + 16, top + height - 18, width - 32, 3, [1, 1, 1, 0.25]);
  painter.fillRectangle(left + 16, top + height - 18, (width - 32) * progress, 3, [1, 1, 1, 0.9]);
}

function drawTaskbar(painter: Painter, width: number, height: number, taskbar: number, epoch: number): void {
  const top = height - taskbar;
  painter.fillRectangle(0, top, width, taskbar, [0.11, 0.11, 0.13, 0.94]);
  painter.fillRectangle(0, top, width, 1, [1, 1, 1, 0.07]);
  const icons: Color[] = [
    [0.85, 0.87, 0.92, 1],
    [0.36, 0.55, 0.95, 1],
    [0.95, 0.73, 0.25, 1],
    [0.3, 0.75, 0.55, 1],
    [0.85, 0.42, 0.55, 1],
    [0.6, 0.48, 0.92, 1],
  ];
  const start = width / 2 - (icons.length * 44) / 2;
  icons.forEach((color, index) => {
    const x = start + index * 44 + 8;
    if (index === 0) {
      for (let cell = 0; cell < 4; cell += 1) painter.fillRoundedRectangle(x + 4 + (cell % 2) * 11, top + 13 + Math.floor(cell / 2) * 11, 9, 9, 2, color);
      return;
    }
    painter.fillRoundedRectangle(x + 2, top + 11, 26, 26, 6, color);
    if (index === 1) painter.fillRoundedRectangle(x + 12, top + taskbar - 6, 6, 3, 1.5, [0.8, 0.82, 0.88, 1]);
  });
  const clock = new Date(epoch);
  const timeText = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(clock);
  const dateText = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(clock);
  painter.text(timeText, { ...fonts.caption, align: 'end' }, width - 140, top + 6, 120, 18, [0.92, 0.93, 0.95, 1]);
  painter.text(dateText, { ...fonts.caption, align: 'end' }, width - 140, top + 24, 120, 18, [0.92, 0.93, 0.95, 1]);
  painter.text('      ', { ...fonts.glyph, align: 'end', size: 14 }, width - 260, top, 110, taskbar, [0.92, 0.93, 0.95, 1]);
}

function drawTerminal(painter: Painter, frame: Rectangle, time: number): void {
  const lineHeight = 21;
  const top = frame.top + 40;
  painter.fillRectangle(frame.left + 1, top, frame.width - 2, frame.height - 41, [12 / 255, 12 / 255, 14 / 255, 1]);
  const count = Math.min(logLines.length, Math.max(1, Math.floor(time / 1_250) + 2));
  const capacity = Math.floor((frame.height - 60) / lineHeight);
  const first = Math.max(0, count - capacity);
  for (let line = first; line < count; line += 1) {
    const text = logLines[line]!;
    const error = text.startsWith('✖');
    const color: Color = error ? [1, 0.42, 0.42, 1] : text.includes('✓') ? [0.52, 0.86, 0.6, 1] : [0.8, 0.8, 0.82, 1];
    painter.text(text, fonts.mono, frame.left + 16, top + 10 + (line - first) * lineHeight, frame.width - 32, lineHeight, color);
  }
  if (Math.floor(time / 530) % 2 === 0) painter.fillRectangle(frame.left + 16, top + 14 + (count - first) * lineHeight, 8, 15, [0.8, 0.8, 0.82, 1]);
}

function drawToast(painter: Painter, time: number, width: number, bottom: number): void {
  const shown = 9_000;
  const hidden = 14_000;
  if (time < shown || time > hidden + 400) return;
  const enter = Math.min(1, (time - shown) / 320);
  const leave = Math.min(1, Math.max(0, (time - hidden) / 260));
  const slide = (1 - easeOut(enter)) * 380 + easeIn(leave) * 380;
  const toastWidth = 364;
  const toastHeight = 112;
  const left = width - toastWidth - 16 + slide;
  const top = bottom - toastHeight - 16;
  painter.fillRoundedRectangle(left - 1, top + 3, toastWidth + 2, toastHeight + 2, 9, [0, 0, 0, 0.28]);
  painter.fillRoundedRectangle(left, top, toastWidth, toastHeight, 8, [43 / 255, 43 / 255, 46 / 255, 1]);
  painter.strokeRoundedRectangle(left + 0.5, top + 0.5, toastWidth - 1, toastHeight - 1, 8, 1, [1, 1, 1, 0.08]);
  painter.fillRoundedRectangle(left + 16, top + 16, 18, 18, 4, [0.24, 0.72, 0.52, 1]);
  painter.text('', { ...fonts.glyph, align: 'center', size: 11 }, left + 16, top + 16, 18, 18, [1, 1, 1, 1]);
  painter.text('Sign-in', fonts.caption, left + 42, top + 16, 200, 18, dark.textSoft);
  painter.text('Your verification code', { ...fonts.title, size: 14, weight: 600 }, left + 16, top + 44, toastWidth - 32, 22, dark.text);
  painter.text('482 913 · expires in 30 seconds', { ...fonts.title, size: 14 }, left + 16, top + 68, toastWidth - 32, 22, dark.text);
}

interface Rectangle {
  height: number;
  left: number;
  top: number;
  width: number;
}

function drawWindow(painter: Painter, frame: Rectangle, title: string, darkTheme: boolean): void {
  for (let layer = 4; layer >= 1; layer -= 1) painter.fillRoundedRectangle(frame.left - layer * 3, frame.top - layer * 2 + 6, frame.width + layer * 6, frame.height + layer * 6, 8 + layer * 3, [0, 0, 0, 0.07]);
  const surface: Color = darkTheme ? dark.surface : [0.98, 0.98, 0.99, 1];
  painter.fillRoundedRectangle(frame.left, frame.top, frame.width, frame.height, 8, surface);
  painter.strokeRoundedRectangle(frame.left + 0.5, frame.top + 0.5, frame.width - 1, frame.height - 1, 8, 1, darkTheme ? dark.border : [0, 0, 0, 0.12]);
  const titleColor: Color = darkTheme ? dark.text : [0.12, 0.12, 0.14, 1];
  painter.text(title, fonts.title, frame.left + 16, frame.top, frame.width - 160, 40, titleColor);
  painter.text('            ', { ...fonts.glyph, align: 'end' }, frame.left + frame.width - 160, frame.top, 140, 40, titleColor);
}

function easeIn(value: number): number {
  return value * value * value;
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 3;
}

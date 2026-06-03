/**
 * video-term — plays a real video FILE inside the terminal on the _term TRUECOLOR
 * engine, at a ludicrous frame rate. This is the headline stress-test for the
 * engine's diff + colour-depth + sub-cell-mode machinery on PHOTOGRAPHIC, fully
 * animated content (the hardest possible input for a diffing renderer).
 *
 * Decode: ffmpeg streams raw rgb24 frames, scaled + letterboxed to the terminal's
 * exact pixel grid (cols·pxW × rows·pxH for the active mode), straight into t.buf.
 * No per-pixel work in TypeScript on the decode side — ffmpeg does the scaling,
 * the engine does the diffing. (video.ts is the sibling pure-Media-Foundation +
 * audio player for the _textterm char engine; this one targets _term.)
 *
 * Two paths, both via runDemo so console setup / pacing / HUD / resize / the whole
 * TERM_MODE·TERM_DIFF·TERM_DEPTH option matrix come for free:
 *   • LIVE   — ffmpeg runs realtime (-re), looping (-stream_loop -1); a background
 *              reader keeps the latest decoded frame; each render copies it in.
 *   • BENCH / CAPTURE_PNG — pre-decode N distinct frames to memory, then cycle them
 *              so BENCH measures the engine's true ceiling on REAL video and a
 *              CAPTURE writes a real frame to PNG for headless inspection.
 *
 * Pick the file with $VIDEO or argv[2]; otherwise a default capture is used.
 * Try it loud:
 *   TERM_MODE=sextant TERM_DIFF=threshold TERM_THRESHOLD=18 bun run example/video-term.ts
 *   TERM_DEPTH=16 BENCH=1 bun run example/video-term.ts        (the big fps number)
 */
import { runDemo, type Term } from './_term';

const DEFAULT_VIDEO = 'C:\\Users\\stevp\\Videos\\Captures\\Counter-Strike 2 2025-11-16 19-40-24.mp4';
const videoPath = process.argv[2] ?? process.env.VIDEO ?? DEFAULT_VIDEO;
const fileName = videoPath.replace(/^.*[\\/]/, '');
const headless = (process.env.CAPTURE_PNG ?? '') !== '' || process.env.BENCH === '1';
const startSec = Number(process.env.VIDEO_SS ?? 30) || 0; // seek past the intro into action

// ffmpeg's video filter: scale into the grid preserving aspect, pad the rest black.
const vfChain = (W: number, H: number): string =>
  `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`;

let proc: ReturnType<typeof Bun.spawn> | null = null;
const killFfmpeg = (): void => {
  try {
    proc?.kill();
  } catch {
    /* ignore */
  }
};
process.on('exit', killFfmpeg);
let stopped = false; // set when the demo loop ends → unblocks/abandons the reader

// ── LIVE: background reader keeps the most-recent decoded frame ────────────────
let latest: Uint8Array | null = null;
let frameSize = 0;

const startLive = (W: number, H: number): void => {
  frameSize = W * H * 3;
  latest = new Uint8Array(frameSize);
  proc = Bun.spawn({
    cmd: [
      'ffmpeg', '-hide_banner', '-loglevel', 'error',
      '-stream_loop', '-1', '-re', '-ss', String(startSec),
      '-i', videoPath,
      '-vf', vfChain(W, H), '-r', '60',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
    ],
    stdout: 'pipe',
    stderr: 'inherit',
  });
  // Drain the pipe forever, assembling complete frames into `latest`.
  (async () => {
    const carry = new Uint8Array(frameSize);
    let have = 0;
    try {
      for await (const chunk of proc!.stdout as ReadableStream<Uint8Array>) {
        if (stopped) break;
        let off = 0;
        while (off < chunk.length) {
          const need = frameSize - have;
          const take = Math.min(need, chunk.length - off);
          carry.set(chunk.subarray(off, off + take), have);
          have += take;
          off += take;
          if (have === frameSize) {
            latest!.set(carry);
            have = 0;
          }
        }
      }
    } catch {
      /* pipe closed on exit */
    }
  })();
};

// ── BENCH/CAPTURE: synchronously pre-decode N distinct frames ──────────────────
const preFrames: Uint8Array[] = [];
const decodeFrames = async (W: number, H: number, n: number): Promise<void> => {
  frameSize = W * H * 3;
  const p = Bun.spawn({
    cmd: [
      'ffmpeg', '-hide_banner', '-loglevel', 'error',
      '-ss', String(startSec), '-i', videoPath,
      '-vf', vfChain(W, H), '-r', '30', '-frames:v', String(n),
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
    ],
    stdout: 'pipe',
    stderr: 'inherit',
  });
  const carry = new Uint8Array(frameSize);
  let have = 0;
  for await (const chunk of p.stdout as ReadableStream<Uint8Array>) {
    let off = 0;
    while (off < chunk.length) {
      const need = frameSize - have;
      const take = Math.min(need, chunk.length - off);
      carry.set(chunk.subarray(off, off + take), have);
      have += take;
      off += take;
      if (have === frameSize) {
        preFrames.push(carry.slice());
        have = 0;
      }
    }
  }
  await p.exited;
};

await runDemo({
  title: `VIDEO ${fileName}`,
  hud: 'real video on _term · SPACE pause · TERM_MODE/DIFF/DEPTH to taste · ESC quit',
  captureT: 2,
  targetFps: 0, // uncapped: let the HUD show the engine's true render ceiling
  drawHud: true,
  init: async (t: Term) => {
    if (headless) {
      const n = Math.max(30, Math.min(180, Number(process.env.BENCH_FRAMES ?? 120) | 0));
      await decodeFrames(t.W, t.H, n);
      if (preFrames.length === 0) {
        process.stderr.write(`video-term: no frames decoded from "${videoPath}". Is ffmpeg installed and the path valid?\n`);
      }
    } else {
      startLive(t.W, t.H);
    }
  },
  resize: (t: Term) => {
    // Terminal changed size → restart ffmpeg at the new grid resolution.
    if (!headless) {
      killFfmpeg();
      startLive(t.W, t.H);
    }
  },
  frame: (t: Term, _time, _dt, frame) => {
    if (headless) {
      if (preFrames.length > 0) t.buf.set(preFrames[frame % preFrames.length]);
    } else if (latest) {
      t.buf.set(latest);
    }
  },
});

// The demo loop has ended (ESC / q / DEMO_DURATION_MS): stop the reader and the
// ffmpeg child so the pending stream read can't keep the process alive forever.
stopped = true;
killFfmpeg();
process.exit(0);

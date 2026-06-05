/**
 * video-term — plays a real video FILE inside the terminal on the _term TRUECOLOR
 * engine, at a ludicrous frame rate. This is the headline stress-test for the
 * engine's diff + colour-depth + sub-cell-mode machinery on PHOTOGRAPHIC, fully
 * animated content (the hardest possible input for a diffing renderer).
 *
 * Decode: ffmpeg streams raw rgb24 frames, scaled + letterboxed to the terminal's
 * exact pixel grid (cols·pxW × rows·pxH for the active mode), straight into t.pixels.
 * No per-pixel work in TypeScript on the decode side — ffmpeg does the scaling,
 * the engine does the diffing. (video.ts is the sibling pure-Media-Foundation +
 * audio player for the _textterm char engine; this one targets _term.)
 *
 * Two paths, both via run so console setup / pacing / HUD / resize / the whole
 * TERM_MODE·TERM_DIFF·TERM_DEPTH option matrix come for free:
 *   • LIVE   — ffmpeg decodes (looping via -stream_loop -1) into a bounded frame
 *              QUEUE; the render loop drains it on a SIM-TIME clock for smooth,
 *              correctly-paced playback. SPACE freezes sim time → a true pause (the
 *              full queue backpressures ffmpeg, so it blocks rather than buffering).
 *              Live keys cycle the render options without restarting the process:
 *              M = sub-cell mode (half→quad→sextant→braille→ascii), D = diff
 *              strategy, C = colour depth — via Term.reconfigure().
 *   • BENCH / CAPTURE_PNG — pre-decode N distinct frames to memory, then cycle them
 *              so BENCH measures the engine's true ceiling on REAL video and a
 *              CAPTURE writes a real frame to PNG for headless inspection.
 *
 * The video file is REQUIRED — pass it as argv[2] or via $VIDEO. Try it loud:
 *   TERM_MODE=sextant TERM_DIFF=threshold TERM_THRESHOLD=18 bun run example/video-term.ts clip.mp4
 *   TERM_DEPTH=16 BENCH=1 bun run example/video-term.ts clip.mp4        (the big fps number)
 */
import { run, type Term, type TermMode, type TermDiff, type TermDepth } from '@bun-win32/terminal';

const videoPath = process.argv[2] ?? process.env.VIDEO;
if (videoPath === undefined) {
  process.stdout.write('usage: bun run example/video-term.ts <path-to-video.mp4|mkv|avi|mov|…>   (or set $VIDEO)\n');
  process.exit(1);
}
const fileName = videoPath.replace(/^.*[\\/]/, '');
const headless = (process.env.CAPTURE_PNG ?? '') !== '' || process.env.BENCH === '1';
const startSec = Number(process.env.VIDEO_SS ?? 30) || 0; // seek past the intro into action

// ffmpeg's video filter: scale into the grid preserving aspect, pad the rest black.
const vfChain = (W: number, H: number): string => `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`;

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
let gen = 0; // bumped on each startLive so a stale reader (after a switch) self-exits

// Live render options, synced to the Term in init() and cycled by the M/D/C keys.
const MODES: TermMode[] = ['half', 'quad', 'sextant', 'braille', 'ascii'];
const DIFFS: TermDiff[] = ['exact', 'threshold', 'none'];
const DEPTHS: TermDepth[] = ['truecolor', '256', '16'];
let curMode: TermMode = 'half';
let curDiff: TermDiff = 'exact';
let curDepth: TermDepth = 'truecolor';
let curThr = 8;

// ── LIVE: a reader fills a bounded frame QUEUE; the render loop drains it on a
// sim-time clock. Decode runs ~10× realtime, so the queue stays full; when it
// fills (display paused or behind) the reader stops draining the pipe and ffmpeg
// blocks — that backpressure is what makes pause a TRUE pause instead of buffering
// the whole clip in RAM. The render loop is left UNCAPPED (targetFps Infinity) so the
// async reader runs on every event-loop turn and never starves: a blocking frame
// wait would freeze the reader for ~16ms and the OS pipe can only buffer ~64KB in
// that window, which would underrun the queue and stutter. Smoothness instead
// comes from the sim-time playhead, not from the loop cadence.
const FPS = 60; // playback cadence (matches the ffmpeg -r below)
const QUEUE_MAX = 60; // ~1s of look-ahead
let frameSize = 0;
const queue: Uint8Array[] = []; // decoded frames in order; queue[0] is frame `nextIdx`
const pool: Uint8Array[] = []; // recycled frame buffers (avoids per-frame GC churn → jitter)
let nextIdx = 0; // absolute index of the frame at queue[0]
let originSet = false;
let origin = 0; // sim time at which frame 0 is shown
let curFrame: Uint8Array | null = null;
let shownIdx = -1; // last index copied into t.pixels (skips redundant memcpy on spin iterations)

const startLive = (W: number, H: number): void => {
  const fs = W * H * 3; // captured locally so a stale reader never uses a changed size
  frameSize = fs;
  queue.length = 0;
  pool.length = 0; // old-size pooled buffers are wrong after a mode switch → drop them
  nextIdx = 0;
  originSet = false;
  curFrame = null;
  shownIdx = -1;
  gen++;
  const myGen = gen;
  proc = Bun.spawn({
    cmd: ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-stream_loop', '-1', '-ss', String(startSec), '-i', videoPath, '-vf', vfChain(W, H), '-r', String(FPS), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    stdout: 'pipe',
    stderr: 'inherit',
  });
  // Assemble complete frames into the queue, applying backpressure when it's full.
  // A newer startLive (mode/size switch, or exit) bumps `gen` → this reader returns
  // without ever pushing a wrong-sized frame into the freshly-reset queue.
  (async () => {
    let frame = pool.pop() ?? new Uint8Array(fs);
    let have = 0;
    try {
      for await (const chunk of proc!.stdout as ReadableStream<Uint8Array>) {
        if (stopped || myGen !== gen) return;
        let off = 0;
        while (off < chunk.length) {
          const take = Math.min(fs - have, chunk.length - off);
          frame.set(chunk.subarray(off, off + take), have);
          have += take;
          off += take;
          if (have === fs) {
            if (stopped || myGen !== gen) return;
            queue.push(frame);
            have = 0;
            frame = pool.pop() ?? new Uint8Array(fs);
            while (!stopped && myGen === gen && queue.length >= QUEUE_MAX) await Bun.sleep(8);
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
    cmd: ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', String(startSec), '-i', videoPath, '-vf', vfChain(W, H), '-r', '30', '-frames:v', String(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
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

await run({
  title: `VIDEO ${fileName}`,
  hud: 'M mode · D diff · C depth · SPACE pause · ESC quit',
  captureT: 2,
  targetFps: Infinity, // see the LIVE note above
  drawHud: true,
  init: async (t: Term) => {
    // Sync the live-option state to however the Term was configured (env / defaults).
    curMode = t.mode;
    curDiff = t.diff;
    curDepth = t.depth;
    curThr = t.threshold;
    if (headless) {
      const n = Math.max(30, Math.min(180, Number(process.env.BENCH_FRAMES ?? 120) | 0));
      await decodeFrames(t.width, t.height, n);
      if (preFrames.length === 0) {
        process.stderr.write(`video-term: no frames decoded from "${videoPath}". Is ffmpeg installed and the path valid?\n`);
      }
    } else {
      startLive(t.width, t.height);
    }
  },
  resize: (t: Term) => {
    // Terminal changed size → re-apply the live options (run rebuilt the Term
    // from the original env opts) and restart ffmpeg at the new grid resolution.
    if (!headless) {
      t.reconfigure({ mode: curMode, diff: curDiff, depth: curDepth, threshold: curThr });
      killFfmpeg();
      startLive(t.width, t.height);
    }
  },
  onKey: (key: string, t: Term) => {
    if (headless) return;
    let changed = false;
    if (key === 'm') {
      curMode = MODES[(MODES.indexOf(curMode) + 1) % MODES.length];
      changed = true;
    } else if (key === 'd') {
      curDiff = DIFFS[(DIFFS.indexOf(curDiff) + 1) % DIFFS.length];
      changed = true;
    } else if (key === 'c') {
      curDepth = DEPTHS[(DEPTHS.indexOf(curDepth) + 1) % DEPTHS.length];
      changed = true;
    }
    if (!changed) return;
    const ow = t.width,
      oh = t.height;
    t.reconfigure({ mode: curMode, diff: curDiff, depth: curDepth, threshold: curThr });
    // A mode change alters the pixel resolution → re-decode at the new size. A
    // diff/depth change keeps the same frames, so the next repaint just adopts it.
    if (t.width !== ow || t.height !== oh) {
      killFfmpeg();
      startLive(t.width, t.height);
    }
  },
  frame: (t: Term, time, _dt, frameNo) => {
    if (headless) {
      if (preFrames.length > 0) t.pixels.set(preFrames[frameNo % preFrames.length]);
      return;
    }
    // LIVE: drain the queue on the sim-time clock. `time` (run's simTime) stops
    // advancing while paused, so the playhead — and the picture — freeze on SPACE.
    if (!originSet) {
      if (queue.length === 0) return; // nothing decoded yet → hold the (black) frame
      origin = time;
      originSet = true;
    }
    const target = Math.floor((time - origin) * FPS);
    while (nextIdx < target && queue.length > 1) {
      const old = queue.shift()!;
      if (pool.length < QUEUE_MAX + 4) pool.push(old); // recycle to dodge GC jitter
      nextIdx++;
    }
    curFrame = queue[0] ?? curFrame;
    if (curFrame && nextIdx !== shownIdx) {
      t.pixels.set(curFrame);
      shownIdx = nextIdx;
    }
  },
});

// The demo loop has ended (ESC / q / DEMO_DURATION_MS): stop the reader and the
// ffmpeg child so the pending stream read can't keep the process alive forever.
stopped = true;
killFfmpeg();
process.exit(0);

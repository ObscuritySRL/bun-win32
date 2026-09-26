// Unit tests for @bun-win32/overlay. Rendering assertions read frames back through capture() (pre-multiplied
// RGBA, top-down). Run: `bun test packages/overlay/overlay.test.ts`.

import { Overlay } from './overlay';
import { Gradient } from './paint';

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

const HEIGHT = 240;
const WIDTH = 320;

const pixels = new Uint8Array(WIDTH * HEIGHT * 4);

let overlay: Overlay;

/** Pre-multiplied [r, g, b, a] at window pixel (x, y) of the last captured frame */
function pixel(x: number, y: number): [number, number, number, number] {
  const offset = (y * WIDTH + x) * 4;

  return [pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3]];
}

/** Presents the frame and captures what the window now shows */
function present(): void {
  overlay.update();
  overlay.capture(pixels);
}

beforeAll(() => {
  overlay = new Overlay({ height: HEIGHT, title: 'Test Overlay', width: WIDTH, x: -32000, y: -32000 });
});

afterAll(() => {
  overlay.close();
});

describe('Overlay', () => {
  describe('construction', () => {
    test('creates with specified dimensions', () => {
      expect(overlay.height).toBe(HEIGHT);
      expect(overlay.width).toBe(WIDTH);
    });

    test('creates with custom position', () => {
      const custom = new Overlay({ height: 30, width: 40, x: -32000, y: -31000 });

      expect(custom.x).toBe(-32000);
      expect(custom.y).toBe(-31000);

      custom.close();
    });

    test('update() returns false once closed', () => {
      const closing = new Overlay({ height: 10, width: 10, x: -32000, y: -32000 });

      expect(closing.update()).toBe(true);
      closing.close();
      expect(closing.update()).toBe(false);
    });
  });

  describe('fills', () => {
    test('rectangle() fills with an exact opaque color', () => {
      overlay.rectangle(10, 10, 40, 30, 0xff0000ff);
      present();

      expect(pixel(30, 25)).toEqual([255, 0, 0, 255]);
      expect(pixel(60, 25)).toEqual([0, 0, 0, 0]);
    });

    test('translucent colors are pre-multiplied', () => {
      overlay.rectangle(10, 10, 40, 30, '#ff000080');
      present();

      expect(pixel(30, 25)).toEqual([128, 0, 0, 128]);
    });

    test('edges are anti-aliased', () => {
      overlay.rectangle(10.5, 10, 40, 30, '#ffffff');
      present();

      const [, , , alpha] = pixel(10, 25);

      expect(alpha).toBeGreaterThan(64);
      expect(alpha).toBeLessThan(192);
      expect(pixel(11, 25)[3]).toBe(255);
    });

    test('antialias: false keeps edges hard', () => {
      const aliased = new Overlay({ antialias: false, height: 40, width: 40, x: -32000, y: -32000 });
      aliased.circle(20, 20, 12.3, '#ffffff');
      aliased.update();

      const view = aliased.capture();

      for (let i = 3; i < view.length; i += 4) {
        expect(view[i] === 0 || view[i] === 255).toBe(true);
      }

      aliased.close();
    });

    test('circle() covers its center and nothing beyond its radius', () => {
      overlay.circle(100, 100, 20, 0x00ff00ff);
      present();

      expect(pixel(100, 100)).toEqual([0, 255, 0, 255]);
      expect(pixel(100, 122)[3]).toBe(0);
      expect(pixel(115, 115)[3]).toBe(0);
    });

    test('concave polygon() leaves its notch empty', () => {
      // Chevron pointing up: tip, right wing, notch, left wing
      overlay.polygon([100, 20, 140, 100, 100, 70, 60, 100], '#ffffff');
      present();

      expect(pixel(100, 50)[3]).toBe(255);
      expect(pixel(100, 90)[3]).toBe(0);
      expect(pixel(130, 90)[3]).toBe(255);
    });

    test('rounded rectangle() clears its corners', () => {
      overlay.rectangle(20, 20, 60, 40, { fill: '#ffffff', radius: 12 });
      present();

      expect(pixel(21, 21)[3]).toBe(0);
      expect(pixel(50, 21)[3]).toBe(255);
    });

    test('shadow() draws a soft falloff beneath the shape', () => {
      overlay.rectangle(100, 100, 40, 40, { fill: '#ffffff', shadow: { blur: 10, color: '#000000', y: 0 } });
      present();

      const near = pixel(96, 120)[3];
      const far = pixel(92, 120)[3];

      expect(near).toBeGreaterThan(far);
      expect(far).toBeGreaterThan(0);
    });
  });

  describe('strokes', () => {
    test('stroke-only rectangle() leaves its interior empty', () => {
      overlay.rectangle(20, 20, 60, 40, { stroke: '#ffffff', strokeWidth: 4 });
      present();

      expect(pixel(50, 40)[3]).toBe(0);
      expect(pixel(50, 20)[3]).toBe(255);
    });

    test('dash leaves gaps', () => {
      overlay.line(10, 50, 110, 50, { dash: [10, 10], stroke: '#ffffff', strokeWidth: 4 });
      present();

      expect(pixel(15, 50)[3]).toBe(255);
      expect(pixel(25, 50)[3]).toBe(0);
      expect(pixel(35, 50)[3]).toBe(255);
    });

    test('round cap extends past the endpoint', () => {
      overlay.line(50, 50, 100, 50, { cap: 'round', stroke: '#ffffff', strokeWidth: 10 });
      present();

      expect(pixel(47, 50)[3]).toBe(255);
      expect(pixel(46, 44)[3]).toBe(0);
    });

    test('path API strokes a Bézier curve', () => {
      overlay.beginPath();
      overlay.moveTo(20, 150);
      overlay.bezierCurveTo(60, 50, 140, 50, 180, 150);
      overlay.stroke({ stroke: '#ffffff', strokeWidth: 3 });
      present();

      // The curve's apex (t = 0.5) is at y = 75
      expect(pixel(100, 75)[3]).toBe(255);
      expect(pixel(100, 150)[3]).toBe(0);
    });
  });

  describe('gradients', () => {
    test('linearGradient() runs across the shape', () => {
      overlay.rectangle(0, 0, 200, 20, { fill: overlay.linearGradient(['#ff0000', '#0000ff'], 90) });
      present();

      const [leftRed, , leftBlue] = pixel(2, 10);
      const [rightRed, , rightBlue] = pixel(197, 10);

      expect(leftRed).toBeGreaterThan(240);
      expect(leftBlue).toBeLessThan(15);
      expect(rightBlue).toBeGreaterThan(240);
      expect(rightRed).toBeLessThan(15);
    });

    test('hard stops stay hard', () => {
      overlay.rectangle(0, 0, 200, 20, {
        fill: overlay.linearGradient(
          [
            [0.5, '#ff0000'],
            [0.5, '#0000ff'],
          ],
          90,
        ),
      });
      present();

      expect(pixel(98, 10)).toEqual([255, 0, 0, 255]);
      expect(pixel(101, 10)).toEqual([0, 0, 255, 255]);
    });

    test('radialGradient() fades from the center out', () => {
      overlay.circle(100, 100, 50, overlay.radialGradient(['#ffffff', '#ffffff00']));
      present();

      expect(pixel(100, 100)[3]).toBeGreaterThan(240);
      expect(pixel(125, 100)[3]).toBeGreaterThan(100);
      expect(pixel(125, 100)[3]).toBeLessThan(155);
    });

    test('Gradient spreads bare stops evenly (CSS)', () => {
      const gradient = new Gradient('linear', ['#000', '#fff', '#000']);

      expect(Array.from(gradient.offsets)).toEqual([0, 0.5, 1]);
    });
  });

  describe('state', () => {
    test('translate() moves drawing', () => {
      overlay.save();
      overlay.translate(200, 100);
      overlay.rectangle(0, 0, 10, 10, '#ffffff');
      overlay.restore();
      present();

      expect(pixel(205, 105)[3]).toBe(255);
      expect(pixel(5, 5)[3]).toBe(0);
    });

    test('clip() restricts drawing', () => {
      overlay.save();
      overlay.clip(0, 0, 50, 240);
      overlay.rectangle(0, 0, 100, 20, '#ffffff');
      overlay.restore();
      present();

      expect(pixel(25, 10)[3]).toBe(255);
      expect(pixel(75, 10)[3]).toBe(0);
    });

    test('globalAlpha scales opacity', () => {
      overlay.globalAlpha = 0.5;
      overlay.rectangle(0, 0, 20, 20, '#ffffff');
      present();

      expect(pixel(10, 10)[3]).toBe(128);
      expect(overlay.globalAlpha).toBe(1);
    });

    test('a later frame erases what an earlier frame drew', () => {
      overlay.rectangle(250, 200, 20, 20, '#ffffff');
      present();
      expect(pixel(260, 210)[3]).toBe(255);

      present();
      expect(pixel(260, 210)[3]).toBe(0);
    });
  });

  describe('text rendering', () => {
    test('text() renders anti-aliased glyphs', () => {
      overlay.text('Hello', 10, 40, { size: 24, weight: 700 });
      present();

      let partial = 0;
      let solid = 0;

      for (let y = 15; y < 45; y++) {
        for (let x = 10; x < 80; x++) {
          const alpha = pixel(x, y)[3];

          if (alpha === 255) {
            solid++;
          } else if (alpha > 0) {
            partial++;
          }
        }
      }

      expect(solid).toBeGreaterThan(20);
      expect(partial).toBeGreaterThan(20);
    });

    test('measureText() grows with the text', () => {
      const short = overlay.measureText('Test');
      const long = overlay.measureText('Test Test');

      expect(short).toBeGreaterThan(0);
      expect(long).toBeGreaterThan(short);
    });

    test('maximumWidth truncates with an ellipsis', () => {
      expect(overlay.measureText('A very long player name', { maximumWidth: 60 })).toBeLessThanOrEqual(60);
    });

    test('align center straddles x', () => {
      overlay.text('WWWW', 160, 100, { align: 'center', size: 20 });
      present();

      let left = 0;
      let right = 0;

      for (let y = 80; y < 100; y++) {
        for (let x = 120; x < 200; x++) {
          if (pixel(x, y)[3] > 0) {
            if (x < 160) {
              left++;
            } else {
              right++;
            }
          }
        }
      }

      expect(left).toBeGreaterThan(0);
      expect(abs(left - right) / (left + right)).toBeLessThan(0.2);
    });
  });

  describe('images', () => {
    test('image() draws atlas pixels', () => {
      const image = overlay.createImage(2, 2, new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]));

      overlay.image(image, 40, 40, 20, 20);
      present();

      expect(pixel(50, 50)).toEqual([255, 0, 0, 255]);
    });

    test('createImage() rejects short pixel data', () => {
      expect(() => overlay.createImage(4, 4, new Uint8Array(4))).toThrow();
    });
  });

  describe('capture', () => {
    test('capture() reads opaque mode frames from the front buffer', () => {
      const opaque = new Overlay({ height: 40, mode: 'opaque', width: 40, x: -32000, y: -32000 });

      opaque.rectangle(10, 10, 20, 20, 0x00ff00ff);
      opaque.update();

      const view = opaque.capture();
      const center = (20 * 40 + 20) * 4;

      expect([view[center], view[center + 1], view[center + 2]]).toEqual([0, 255, 0]);
      expect(view[0]).toBe(0);

      opaque.close();
    });

    test('capture() rejects a short target', () => {
      expect(() => overlay.capture(new Uint8Array(4))).toThrow();
    });
  });

  describe('3D', () => {
    test('project() maps the view axis to the center', () => {
      const center = overlay.project(0, 0, -100);

      expect(center).not.toBeNull();
      expect(center!.x).toBeCloseTo(WIDTH / 2, 3);
      expect(center!.y).toBeCloseTo(HEIGHT / 2, 3);
      expect(overlay.project(0, 0, 100)).toBeNull();
    });

    test('box() renders beneath 2D', () => {
      overlay.box(-10, -10, -60, 20, 20, 20, '#ff0000');
      overlay.rectangle(155, 115, 10, 10, '#00ff00');
      present();

      expect(pixel(160, 120)).toEqual([0, 255, 0, 255]);
      expect(pixel(150, 120)).toEqual([255, 0, 0, 255]);
    });

    test('setViewMatrix() accepts a row-major matrix', () => {
      expect(() => {
        overlay.setViewMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        overlay.line3D(0, 0, -50, 10, 10, -100, '#ff0000');
        overlay.sphere(0, 0, -70, 5, { fill: '#ffff0040', segments: 12, stroke: '#ffff00' });
        present();
      }).not.toThrow();
    });
  });

  describe('color parsing', () => {
    test('accepts every color form', () => {
      expect(() => {
        overlay.rectangle(10, 10, 5, 5, '#ff000080');
        overlay.rectangle(10, 10, 5, 5, '#f00');
        overlay.rectangle(10, 10, 5, 5, 'red');
        overlay.rectangle(10, 10, 5, 5, 'rgba(255, 0, 0, 0.5)');
        overlay.rectangle(10, 10, 5, 5, 0xff000080);
        overlay.rectangle(10, 10, 5, 5, { a: 0.5, b: 0, g: 0, r: 1 });
        present();
      }).not.toThrow();
    });

    test('rejects invalid colors', () => {
      expect(() => overlay.rectangle(10, 10, 5, 5, 'not-a-color')).toThrow('Invalid color');
      present();
    });
  });
});

describe('Performance', () => {
  test('achieves 1000+ FPS for a HUD-sized 2D frame', () => {
    const LABEL = { color: '#f3f6fa', size: 14, weight: 700 } as const;
    const PANEL = { fill: '#0b131bc4', radius: 8, stroke: '#ffffff1c' } as const;
    const iterations = 500;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      overlay.rectangle(10, 10, 200, 120, PANEL);
      overlay.text('Health: 100', 20, 40, LABEL);
      overlay.circle(180, 40, 12, 0x7cf29aff);
      overlay.line(20, 60, 200, 60, 0xffffff40);
      overlay.update();
    }

    const framesPerSecond = (iterations / (performance.now() - start)) * 1000;

    console.log(`HUD frame: ${framesPerSecond.toFixed(0)} FPS`);
    expect(framesPerSecond).toBeGreaterThan(1000);
  });
});

const { abs } = Math;

/**
 * Renders the hero video + flavour stills from studio/scene.ts.
 *
 *   npm run render:media                 # everything
 *   npm run render:media -- --only=stills   (or video, or a shot name like hero-mobile)
 *   npm run render:media -- --preview    # one frame of each shot into studio/out
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ShotConfig } from './scene.ts';
import { stills, heroShots, FPS } from './shots.ts';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public', 'media');
const out = join(here, 'out');
const args = new Set(process.argv.slice(2));
const only = [...args].find((a) => a.startsWith('--only='))?.split('=')[1];
const preview = args.has('--preview');
const exe = process.env.CHROMIUM_PATH ?? undefined;

mkdirSync(pub, { recursive: true });
mkdirSync(out, { recursive: true });

const server = await createServer({ root: here, configFile: false, server: { port: 5199, strictPort: true, hmr: false, watch: null }, logLevel: 'warn' });
await server.listen();
const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function open(cfg: ShotConfig) {
  const page = await browser.newPage({ viewport: { width: cfg.width, height: cfg.height } });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto('http://localhost:5199/');
  await page.waitForFunction(() => typeof window.__setup === 'function');
  await page.evaluate((c) => window.__setup(c), cfg);
  return page;
}

const png = (dataUrl: string) => Buffer.from(dataUrl.split(',')[1], 'base64');

async function renderStill(name: string, cfg: ShotConfig) {
  const page = await open(cfg);
  const buf = png(await page.evaluate(() => window.__frame(0)));
  await page.close();
  const raw = join(out, `${name}.png`);
  writeFileSync(raw, buf);
  if (preview) return console.log('preview', raw);
  // trimmed, alpha-preserving webp in two sizes
  for (const w of [480, 900]) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vf', `scale=${w}:-1:flags=lanczos`, '-c:v', 'libwebp', '-quality', '86', '-pix_fmt', 'yuva420p', join(pub, `${name}-${w}.webp`)]);
  }
  console.log('still', name);
}

async function renderVideo(name: string, cfg: ShotConfig) {
  const page = await open(cfg);
  const frames = preview ? 1 : Math.round(cfg.loop * FPS);
  const dir = join(out, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const buf = png(await page.evaluate((t) => window.__frame(t), i / FPS));
    writeFileSync(join(dir, `${String(i).padStart(4, '0')}.png`), buf);
    if (i % 30 === 0) console.log(`${name} ${i}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await page.close();
  if (preview) return console.log('preview', join(dir, '0000.png'));

  const input = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png')];
  // subtle vignette for a filmic finish
  const vf = 'vignette=PI/5,format=yuv420p';
  await run('ffmpeg', [...input, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-profile:v', 'high', '-movflags', '+faststart', '-an', join(pub, `${name}.mp4`)]);
  await run('ffmpeg', [...input, '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', join(pub, `${name}.webm`)]);
  // poster = first frame, so the swap from poster to video is invisible
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(dir, '0000.png'), '-vf', 'vignette=PI/5', '-c:v', 'libwebp', '-quality', '80', join(pub, `${name}-poster.webp`)]);
  console.log('video', name);
}

function run(cmd: string, a: string[]) {
  return new Promise<void>((res, rej) => {
    const p = spawn(cmd, a, { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  // --only=stills | video | <shot name>
  const pick = (kind: string, name: string) => !only || only === kind || only === name;
  for (const [name, cfg] of Object.entries(stills)) if (pick('stills', name)) await renderStill(name, cfg);
  for (const [name, cfg] of Object.entries(heroShots)) if (pick('video', name)) await renderVideo(name, cfg);
  if (!preview && pick('video', 'og')) {
    // social share image from the first desktop frame
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(out, 'hero-desktop', '0000.png'), '-vf', 'crop=1920:1008:0:36,scale=1200:630,vignette=PI/5', '-q:v', '3', join(pub, 'og.jpg')]);
  }
} finally {
  await browser.close();
  await server.close();
}

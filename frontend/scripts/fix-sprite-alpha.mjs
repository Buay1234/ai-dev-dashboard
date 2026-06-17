/**
 * Removes checkerboard, white boxes, and fringe from agent RPG sprite sheets.
 * Per-cell flood-fill (64×64) + global background key.
 * Run: npm run fix:sprite-alpha
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public", "agents");

const AGENTS = ["robin", "zoro", "nami", "franky", "usopp"];
const FRAME_W = 64;
const FRAME_H = 64;
const COLS = 4;
const ROWS = 3;

/** Near-white fringe around AI-generated sprites */
const WHITE_MIN = 195;
/** Near-black checkerboard squares */
const BLACK_MAX = 28;

function isBackgroundColor(r, g, b) {
  if (r >= WHITE_MIN && g >= WHITE_MIN && b >= WHITE_MIN) return true;
  if (r <= BLACK_MAX && g <= BLACK_MAX && b <= BLACK_MAX) return true;

  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  const avg = (r + g + b) / 3;
  // Neutral gray checkerboard (#808080, #C0C0C0, etc.)
  if (maxDiff <= 14 && avg >= 80 && avg <= 232) return true;

  return false;
}

function toRgbaBuffer(data, width, height, channels) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    out[j] = data[i];
    out[j + 1] = data[i + 1];
    out[j + 2] = data[i + 2];
    out[j + 3] = channels === 4 ? data[i + 3] : 255;
  }
  return out;
}

function floodFillCell(rgba, sheetW, ox, oy, fw, fh) {
  const visited = new Uint8Array(fw * fh);
  const queue = [];

  const pixelAt = (lx, ly) => ((oy + ly) * sheetW + (ox + lx)) * 4;
  const local = (lx, ly) => ly * fw + lx;

  const trySeed = (lx, ly) => {
    const li = local(lx, ly);
    if (visited[li]) return;
    const pi = pixelAt(lx, ly);
    if (isBackgroundColor(rgba[pi], rgba[pi + 1], rgba[pi + 2])) {
      visited[li] = 1;
      queue.push([lx, ly]);
    }
  };

  for (let lx = 0; lx < fw; lx++) {
    trySeed(lx, 0);
    trySeed(lx, fh - 1);
  }
  for (let ly = 1; ly < fh - 1; ly++) {
    trySeed(0, ly);
    trySeed(fw - 1, ly);
  }

  while (queue.length > 0) {
    const [lx, ly] = queue.shift();
    const pi = pixelAt(lx, ly);
    rgba[pi + 3] = 0;

    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = lx + dx;
      const ny = ly + dy;
      if (nx < 0 || ny < 0 || nx >= fw || ny >= fh) continue;

      const ni = local(nx, ny);
      if (visited[ni]) continue;

      const npi = pixelAt(nx, ny);
      if (isBackgroundColor(rgba[npi], rgba[npi + 1], rgba[npi + 2])) {
        visited[ni] = 1;
        queue.push([nx, ny]);
      }
    }
  }
}

function processSheet(rgba, width, height) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ox = col * FRAME_W;
      const oy = row * FRAME_H;
      const fw = Math.min(FRAME_W, width - ox);
      const fh = Math.min(FRAME_H, height - oy);
      if (fw <= 0 || fh <= 0) continue;
      floodFillCell(rgba, width, ox, oy, fw, fh);
    }
  }

  // Gutters / stray background pixels between cells
  for (let i = 0; i < rgba.length; i += 4) {
    if (isBackgroundColor(rgba[i], rgba[i + 1], rgba[i + 2])) {
      rgba[i + 3] = 0;
    }
  }

  // Thin white fringe adjacent to transparency
  erodeFringe(rgba, width, height);
}

function hasTransparentNeighbor(rgba, width, height, x, y) {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const ni = (ny * width + nx) * 4;
    if (rgba[ni + 3] < 10) return true;
  }
  return false;
}

function erodeFringe(rgba, width, height) {
  const toClear = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (rgba[i + 3] < 10) continue;

      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];

      if (r >= 180 && g >= 180 && b >= 180 && hasTransparentNeighbor(rgba, width, height, x, y)) {
        toClear.push(i);
      }
    }
  }

  for (const i of toClear) {
    rgba[i + 3] = 0;
  }
}

function countStats(rgba) {
  let transparent = 0;
  let bgOpaque = 0;
  let sprite = 0;
  const total = rgba.length / 4;

  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a < 10) {
      transparent++;
      continue;
    }
    if (isBackgroundColor(rgba[i], rgba[i + 1], rgba[i + 2])) {
      bgOpaque++;
    } else {
      sprite++;
    }
  }

  return {
    transparent: Math.round((transparent / total) * 100),
    bgOpaque: Math.round((bgOpaque / total) * 100),
    sprite: Math.round((sprite / total) * 100),
  };
}

async function fixSheet(agent) {
  const file = path.join(PUBLIC, agent, `${agent}_sheet.png`);
  if (!fs.existsSync(file)) {
    console.warn(`  skip ${agent}: missing sheet`);
    return;
  }

  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = toRgbaBuffer(data, info.width, info.height, info.channels);
  processSheet(rgba, info.width, info.height);

  const stats = countStats(rgba);
  const tmp = file + ".tmp";

  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);

  fs.renameSync(tmp, file);

  console.log(
    `  ${agent}_sheet.png → ${info.width}x${info.height} | transparent ${stats.transparent}% | sprite ${stats.sprite}% | bg-left ${stats.bgOpaque}%`
  );
}

async function main() {
  console.log("Removing checkerboard + white fringe from sprite sheets…");
  for (const agent of AGENTS) {
    await fixSheet(agent);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

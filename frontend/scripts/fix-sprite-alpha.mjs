/**
 * Removes near-white backgrounds from agent sprite sheets → true PNG alpha.
 * Run: npm run fix:sprite-alpha
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public", "agents");

const AGENTS = ["robin", "zoro", "nami", "franky", "usopp"];
const WHITE_THRESHOLD = 240;

function keyWhiteToTransparent(
  data: Buffer,
  width: number,
  height: number,
  channels: number
) {
  const out = Buffer.alloc(width * height * 4);

  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;

    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      out[j + 3] = 0;
    } else {
      out[j + 3] = channels === 4 ? data[i + 3] : 255;
    }
  }

  return out;
}

async function fixSheet(agent: string) {
  const file = path.join(PUBLIC, agent, `${agent}_sheet.png`);
  if (!fs.existsSync(file)) {
    console.warn(`  skip ${agent}: missing sheet`);
    return;
  }

  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = keyWhiteToTransparent(
    data,
    info.width,
    info.height,
    info.channels
  );

  const tmp = file + ".tmp";
  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);

  fs.renameSync(tmp, file);

  const meta = await sharp(file).metadata();
  console.log(`  ${agent}_sheet.png → ${meta.width}x${meta.height} (${meta.channels}ch)`);
}

async function main() {
  console.log("Removing white backgrounds from sprite sheets…");
  for (const agent of AGENTS) {
    await fixSheet(agent);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

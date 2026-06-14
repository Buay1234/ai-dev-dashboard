/**
 * Combines per-pose PNGs into one horizontal sprite sheet per agent.
 * Run: npm run build:sprites
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public", "agents");

const AGENTS = ["zoro", "nami", "franky", "usopp"];
/** Robin uses a hand-authored 4×3 RPG grid sheet — see sprite-sheet-config.ts */
const POSES = ["idle", "walk", "working", "wave", "present"];
const FRAME_W = 301;
const FRAME_H = 496;

async function buildAgentSheet(agent) {
  const dir = path.join(PUBLIC, agent);
  const idlePath = path.join(dir, `${agent}_idle.png`);

  const frameBuffers = await Promise.all(
    POSES.map(async (pose) => {
      const file = path.join(dir, `${agent}_${pose}.png`);
      const source = fs.existsSync(file) ? file : idlePath;

      if (!fs.existsSync(source)) {
        throw new Error(`Missing sprite for ${agent}: ${file}`);
      }

      return sharp(source)
        .resize(FRAME_W, FRAME_H, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    })
  );

  const sheetWidth = FRAME_W * POSES.length;
  const outPath = path.join(dir, `${agent}_sheet.png`);

  await sharp({
    create: {
      width: sheetWidth,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(
      frameBuffers.map((input, index) => ({
        input,
        left: index * FRAME_W,
        top: 0,
      }))
    )
    .png()
    .toFile(outPath);

  console.log(`  ${agent}_sheet.png  (${sheetWidth}x${FRAME_H}, ${POSES.length} frames)`);
}

async function main() {
  console.log("Building agent sprite sheets…");
  for (const agent of AGENTS) {
    await buildAgentSheet(agent);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

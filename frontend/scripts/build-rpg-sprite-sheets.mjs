/**
 * Normalizes agent RPG sprite sheets to 256×192 (4×3 grid @ 64×64).
 * Run: npm run build:sprites
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public", "agents");

const AGENTS = ["robin", "zoro", "nami", "franky", "usopp"];
const SHEET_W = 256;
const SHEET_H = 192;

async function normalizeSheet(agent) {
  const dir = path.join(PUBLIC, agent);
  const out = path.join(dir, `${agent}_sheet.png`);

  if (!fs.existsSync(out)) {
    console.warn(`  skip ${agent}: missing ${out}`);
    return;
  }

  await sharp(out)
    .resize(SHEET_W, SHEET_H, { fit: "fill", kernel: "nearest" })
    .png()
    .toFile(out + ".tmp");

  fs.renameSync(out + ".tmp", out);
  console.log(`  ${agent}_sheet.png → ${SHEET_W}x${SHEET_H}`);
}

async function main() {
  console.log("Normalizing RPG sprite sheets…");
  for (const agent of AGENTS) {
    await normalizeSheet(agent);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

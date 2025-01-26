import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const outPath = path.join(publicDir, "og-icosmith-1200x630.png");
const logoPath = path.join(publicDir, "android-chrome-512x512.png");

const gradientSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0A0F1E"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`;

const textSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><style>.title{font-family:'Inter','Manrope',system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,Cantarell,'Helvetica Neue',Helvetica,Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';font-weight:800;font-size:84px;fill:#fff}.subtitle{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,Cantarell,'Helvetica Neue',Helvetica,Arial,'Noto Sans';font-weight:500;font-size:28px;fill:#e5e7eb}.accent{fill:#F97316}</style><text x="600" y="360" text-anchor="middle" class="title">Ico<tspan class="accent">Smith</tspan></text><text x="600" y="410" text-anchor="middle" class="subtitle">PNG/JPG/SVG → ICO • PWA • Windows</text></svg>`;

async function generate() {
  const bg = Buffer.from(gradientSvg);
  let logoBuf = null;
  try {
    logoBuf = await fs.readFile(logoPath);
  } catch {}
  const composites = [];
  if (logoBuf) {
    const size = 192;
    const resizedLogo = await sharp(logoBuf).resize(size, size, { fit: "contain" }).png().toBuffer();
    const left = Math.round((1200 - size) / 2);
    const top = 120;
    composites.push({ input: resizedLogo, left, top });
  }
  composites.push({ input: Buffer.from(textSvg), left: 0, top: 0 });
  await sharp(bg).png().composite(composites).toFile(outPath);
  const rel = path.relative(rootDir, outPath);
  process.stdout.write(`Generated ${rel}\n`);
}

generate().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});










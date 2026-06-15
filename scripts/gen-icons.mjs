// 北辰 PWAアイコン生成（紺 #0A1228 背景 × 金 #B8902C 北極星 × 明朝「北辰」）
// usage: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const NAVY = "#0A1228";
const GOLD = "#B8902C";
const GOLD_SOFT = "#C9A227";

// 北極星（コンパス型の4方向ロングレイ＋4方向ショートレイ）
function star(cx, cy, R, r) {
  // R: 長い光芒、r: くびれ半径
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2; // 上start
    const long = i % 2 === 0; // 上下左右をロングに
    const rad = long ? R : R * 0.34;
    pts.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]);
  }
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function svg({ size, maskable = false, withText = true }) {
  const cx = size / 2;
  // maskableは安全域確保のため星を小さめ＆中央寄せ
  const scale = maskable ? 0.62 : 0.78;
  const starR = (size * scale) / 2;
  const cy = withText ? size * 0.43 : size * 0.5;
  const ring = starR * 1.16;
  const text = withText
    ? `<text x="${cx}" y="${size * 0.84}" text-anchor="middle"
         font-family="'Noto Serif JP','Yu Mincho',serif" font-weight="600"
         font-size="${size * 0.16}" fill="${GOLD_SOFT}" letter-spacing="${size * 0.01}">北辰</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${NAVY}"/>
  <circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="${GOLD}" stroke-opacity="0.28" stroke-width="${size * 0.006}"/>
  <polygon points="${star(cx, cy, starR, starR * 0.34)}" fill="${GOLD}"/>
  <circle cx="${cx}" cy="${cy}" r="${size * 0.018}" fill="${NAVY}"/>
  ${text}
</svg>`;
}

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

const jobs = [
  { file: "icon-192.png", size: 192, opt: { size: 192 } },
  { file: "icon-512.png", size: 512, opt: { size: 512 } },
  { file: "icon-maskable-512.png", size: 512, opt: { size: 512, maskable: true } },
  { file: "apple-touch-icon.png", size: 180, opt: { size: 180 } },
];

for (const j of jobs) {
  const buf = Buffer.from(svg(j.opt));
  await sharp(buf, { density: 384 }).resize(j.size, j.size).png().toFile(`${OUT}/${j.file}`);
  console.log("✓", `${OUT}/${j.file}`);
}

// ファビコン用（小さめ・テキストなし）
await sharp(Buffer.from(svg({ size: 64, withText: false })), { density: 384 })
  .resize(64, 64)
  .png()
  .toFile(`${OUT}/icon-64.png`);
console.log("✓", `${OUT}/icon-64.png`);
console.log("done.");

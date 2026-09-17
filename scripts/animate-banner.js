const fs = require("fs");

const WIDTH = 1400;
const HEIGHT = 380;
const FPS = 12;
const DURATION = 8;
const FRAMES = FPS * DURATION;

const source = fs.readFileSync("profile-banner.svg", "utf8");

fs.rmSync("dist/banner", { recursive: true, force: true });
fs.mkdirSync("dist/banner", { recursive: true });

for (let frame = 0; frame < FRAMES; frame++) {
  const t = frame / FRAMES;

  const scanX = -150 + t * 1700;
  const pulse = 0.55 + 0.45 * Math.sin(t * Math.PI * 4);

  let svg = source;

  svg = svg.replace(
    '<rect x="50" y="315" width="150" height="2" fill="url(#cyanLine)"/>',
    `<rect x="${scanX}" y="315" width="150" height="2" fill="url(#cyanLine)" opacity="${pulse.toFixed(2)}"/>`
  );

  svg = svg.replace(
    '<circle cx="585" cy="93" r="3" fill="#00B7FF"/>',
    `<circle cx="585" cy="93" r="${(2.5 + pulse * 1.5).toFixed(2)}" fill="#00B7FF" opacity="${pulse.toFixed(2)}"/>`
  );

  svg = svg.replace(
    '<circle cx="835" cy="96" r="3" fill="#00B7FF"/>',
    `<circle cx="835" cy="96" r="${(2.5 + pulse * 1.5).toFixed(2)}" fill="#00B7FF" opacity="${(1.1 - pulse * 0.35).toFixed(2)}"/>`
  );

  svg = svg.replace(
    'fill="#00B7FF">\n    SYSTEM ONLINE',
    `fill="#00B7FF" opacity="${(0.65 + pulse * 0.35).toFixed(2)}">\n    SYSTEM ONLINE`
  );

  fs.writeFileSync(
    `dist/banner/frame-${String(frame).padStart(3, "0")}.svg`,
    svg,
    "utf8"
  );
}

console.log(`Generated ${FRAMES} animation frames.`);

// Writes the README banner: the home page hero at desktop width, text on the left
// and the tesseract on the right. GitHub does not run scripts in a README, so the
// motion is baked into SMIL keyframes. Run with: node scripts/readme-banner.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { BOX, EDGES, project } from '../src/lib/tesseract.js';

const OUT = new URL('../../.github/assets/', import.meta.url);
const FONT = new URL(
	'../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
	import.meta.url
);

// the hero section in routes/+page.svelte: px-8 py-6, two columns with gap-4, and
// the tesseract box at least h-96 tall
const W = 1200;
const PAD_X = 32;
const PAD_Y = 24;
const GAP = 16;
const COL = (W - 2 * PAD_X - GAP) / 2;
const BOX_W = COL;
const BOX_H = 384;
const H = BOX_H + 2 * PAD_Y;
const CX = W - PAD_X - BOX_W / 2;
const CY = H / 2;
const SCALE = Math.min(BOX_W, BOX_H) * 1.55;
const RING = 28;
const FRAMES = 120;

// the hero turns x-w at angle and y-z at 0.7 * angle, which never repeats. Here y-z
// turns at 0.75 * angle, so after one full turn y-z has done three quarter turns and
// the shape is back where it started (with its corners swapped around).
const LOOP = 2 * Math.PI;
const RATIO = 0.75;
const SECONDS = LOOP / (0.005 * 60); // hero speed: 0.005 per frame at 60 fps
const BEAT = (2 * Math.PI) / (0.03 * 60); // corner pulse period
const SPIN = (2 * Math.PI) / (0.03 * 0.3 * 60); // ring period

// chalk colors from colors.js, and the .dark tokens from layout.css:
// background oklch(0), foreground oklch(0.985)
const t = {
	bg: '#000000',
	text: '#fafafa',
	bright: '#fafafa',
	line: '#3f3f46',
	dim: '#71717a'
};

// the hero title, as written in routes/+page.svelte
const TITLE = ['Glass Box'];

// the tesseract graph is 4-regular, so one path can walk every edge once
function circuit() {
	const left = EDGES.map(([a, b]) => [a, b]);
	const used = new Array(left.length).fill(false);
	const stack = [0];
	const walk = [];
	while (stack.length) {
		const v = stack[stack.length - 1];
		const e = left.findIndex(([a, b], i) => !used[i] && (a === v || b === v));
		if (e < 0) walk.push(stack.pop());
		else {
			used[e] = true;
			stack.push(left[e][0] === v ? left[e][1] : left[e][0]);
		}
	}
	return walk;
}

const n = (x) => x.toFixed(1).replace(/\.0$/, '');
const route = circuit();

function rotation(a) {
	return { c1: Math.cos(a), s1: Math.sin(a), c2: Math.cos(a * RATIO), s2: Math.sin(a * RATIO) };
}

// projected corners for every keyframe, for the big and the small tesseract
const frames = [];
for (let f = 0; f <= FRAMES; f++) {
	const r = rotation(0.7 + (f / FRAMES) * LOOP);
	frames.push(
		[1, 0.5].map((s) => BOX.map((p) => project(p[0] * s, p[1] * s, p[2] * s, p[3] * s, r, CX, CY, SCALE)))
	);
}

function tesseract(k, size, alpha) {
	const d = frames
		.map((fr) => 'M' + route.map((i) => n(fr[k][i][0]) + ' ' + n(fr[k][i][1])).join('L'))
		.join(';');
	// the first frame doubles as the still picture for viewers without SMIL
	let out = `<path d="${d.split(';')[0]}" fill="none" stroke="${t.line}" stroke-width="1.5" stroke-linejoin="round" opacity="${alpha}">`;
	out += `<animate attributeName="d" dur="${SECONDS.toFixed(2)}s" repeatCount="indefinite" values="${d}"/></path>`;
	const base = size === 1 ? 4.5 : 2.5;
	for (let i = 0; i < 16; i++) {
		const xs = frames.map((fr) => n(fr[k][i][0])).join(';');
		const ys = frames.map((fr) => n(fr[k][i][1])).join(';');
		// the pulse phase follows the x and w bits only, so when the loop swaps corners
		// around inside the y-z plane, each spot keeps the same pulse
		const phase = ((i & 1) + ((i >> 3) & 1) * 2) / 4;
		out += `<circle cx="${n(frames[0][k][i][0])}" cy="${n(frames[0][k][i][1])}" r="${base}" fill="${t.bright}">`;
		out += `<animate attributeName="cx" dur="${SECONDS.toFixed(2)}s" repeatCount="indefinite" values="${xs}"/>`;
		out += `<animate attributeName="cy" dur="${SECONDS.toFixed(2)}s" repeatCount="indefinite" values="${ys}"/>`;
		out += `<animate attributeName="r" dur="${BEAT.toFixed(2)}s" begin="-${(phase * BEAT).toFixed(2)}s" repeatCount="indefinite" values="${n(base)};${n(base + 1.3)};${n(base)};${n(base - 1.3)};${n(base)}" calcMode="spline" keySplines=".37 0 .63 1;.37 0 .63 1;.37 0 .63 1;.37 0 .63 1"/>`;
		out += '</circle>';
	}
	return out;
}

// the left column holds only the title, semibold like the hero's. Each line is
// sized to WIDTH of the column; JetBrains Mono is 0.6em per character.
const WIDTH = 0.8;
function copy() {
	const longest = Math.max(...TITLE.map((l) => l.length));
	const size = Math.floor((COL * WIDTH) / (longest * 0.6));
	const lead = size * 1.05;
	return TITLE.map((line, i) => {
		const y = CY + (i - (TITLE.length - 1) / 2) * lead;
		return `<text x="${PAD_X}" y="${n(y)}" font-size="${size}" font-weight="600" fill="${t.text}">${line}</text>`;
	}).join('');
}

function svg() {
	const font = readFileSync(FONT).toString('base64');
	// the ring is an ellipse, 0.4 of the box each way, so each dot rides along it
	const rx = BOX_W * 0.4;
	const ry = BOX_H * 0.4;
	const orbit = `M${CX + rx} ${CY}A${rx} ${ry} 0 1 1 ${CX - rx} ${CY}A${rx} ${ry} 0 1 1 ${CX + rx} ${CY}`;
	let ring = `<g fill="${t.dim}">`;
	for (let i = 0; i < RING; i++) {
		const a = (i / RING) * 2 * Math.PI;
		ring += `<circle cx="${n(CX + Math.cos(a) * rx)}" cy="${n(CY + Math.sin(a) * ry)}" r="2.5">`;
		// cx and cy are only the still picture; once moving, the dot follows the orbit alone
		ring += '<set attributeName="cx" to="0"/><set attributeName="cy" to="0"/>';
		ring += `<animateMotion path="${orbit}" dur="${SPIN.toFixed(2)}s" begin="-${((i / RING) * SPIN).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
	}
	ring += '</g>';

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Glass Box">
<style>@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url(data:font/woff2;base64,${font}) format("woff2")}text{font-family:"JetBrains Mono",ui-monospace,monospace;dominant-baseline:central}</style>
<rect width="${W}" height="${H}" rx="12" fill="${t.bg}"/>
${ring}
${tesseract(0, 1, 0.9)}
${tesseract(1, 0.5, 0.45)}
${copy()}
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
const file = new URL('banner.svg', OUT);
writeFileSync(file, svg());
console.log(file.pathname, (readFileSync(file).length / 1024).toFixed(0) + ' KB');

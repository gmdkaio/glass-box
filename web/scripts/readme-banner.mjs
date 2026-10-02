// Writes the README banner: the home page hero at desktop width, text on the left
// and the tesseract on the right. GitHub does not run scripts in a README, so the
// motion is baked into SMIL keyframes. Run with: node scripts/readme-banner.mjs
//
// Inside an <img> the browser redraws the whole picture for every running
// animation, so the banner keeps them few: one path per tesseract for the edges,
// one path per pulse phase for the corners, and one dashed ellipse for the ring.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { BOX, EDGES, project } from '../src/lib/tesseract.js';
import { UPM, GLYPHS } from './title-glyphs.js';

const OUT = new URL('../../.github/assets/', import.meta.url);

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
const TITLE = 'Glass Box';

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
// the tesseract is drawn at double size inside a half-scale group, so its keyframe
// coordinates can be whole numbers (half pixels) instead of decimals
const h = (x) => String(Math.round(x * 2));
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

const spline = '.37 0 .63 1;.37 0 .63 1;.37 0 .63 1;.37 0 .63 1';

function tesseract(k, size, alpha) {
	const d = frames
		.map((fr) => 'M' + route.map((i) => h(fr[k][i][0]) + ' ' + h(fr[k][i][1])).join('L'))
		.join(';');
	// the first frame doubles as the still picture for viewers without SMIL
	let out = `<path d="${d.split(';')[0]}" fill="none" stroke="${t.line}" stroke-width="3" stroke-linejoin="round" opacity="${alpha}">`;
	out += `<animate attributeName="d" dur="${SECONDS.toFixed(2)}s" repeatCount="indefinite" values="${d}"/></path>`;
	// Corners share a pulse phase by their x and w bits only, so when the loop swaps
	// corners around inside the y-z plane, each spot keeps the same pulse. Each phase
	// is one path of zero-length segments with round caps, one dot per corner, and the
	// pulse is its stroke width (twice the dot radius, doubled again for the group).
	const base = size === 1 ? 4.5 : 2.5;
	const w = (r) => n(4 * r);
	for (let g = 0; g < 4; g++) {
		const ids = BOX.map((_, i) => i).filter((i) => (i & 1) + ((i >> 3) & 1) * 2 === g);
		const dots = frames
			.map((fr) => ids.map((i) => 'M' + h(fr[k][i][0]) + ' ' + h(fr[k][i][1]) + 'h0').join(''))
			.join(';');
		out += `<path d="${dots.split(';')[0]}" stroke="${t.bright}" stroke-linecap="round" stroke-width="${w(base)}">`;
		out += `<animate attributeName="d" dur="${SECONDS.toFixed(2)}s" repeatCount="indefinite" values="${dots}"/>`;
		out += `<animate attributeName="stroke-width" dur="${BEAT.toFixed(2)}s" begin="-${((g / 4) * BEAT).toFixed(2)}s" repeatCount="indefinite" values="${w(base)};${w(base + 1.3)};${w(base)};${w(base - 1.3)};${w(base)}" calcMode="spline" keySplines="${spline}"/></path>`;
	}
	return out;
}

// The left column holds only the title, semibold like the hero's, drawn from letter
// outlines so the banner carries no font. It spans WIDTH of the column, every letter
// is one advance wide (a monospace face), and its capitals are centred on the banner.
const WIDTH = 0.8;
const CAP = 730; // capital height in font units
function copy() {
	const advance = GLYPHS[TITLE[0]][0];
	const size = Math.floor((COL * WIDTH) / ((TITLE.length * advance) / UPM));
	const k = size / UPM;
	const base = CY + (CAP * k) / 2;
	const letters = [...TITLE]
		.map((ch, i) => [GLYPHS[ch][1], i * advance])
		.filter(([d]) => d)
		.map(([d, x]) => `<path transform="translate(${x})" d="${d}"/>`)
		.join('');
	return `<g fill="${t.text}" transform="translate(${PAD_X} ${n(base)}) scale(${k})">${letters}</g>`;
}

function svg() {
	// The ring is an ellipse, 0.4 of the box each way. Its dots are zero-length dashes
	// with round caps, and moving the dash offset carries them along it.
	const rx = BOX_W * 0.4;
	const ry = BOX_H * 0.4;
	const orbit = `M${CX + rx} ${CY}A${rx} ${ry} 0 1 1 ${CX - rx} ${CY}A${rx} ${ry} 0 1 1 ${CX + rx} ${CY}`;
	const gap = 1000 / RING;
	let ring = `<path d="${orbit}" pathLength="1000" fill="none" stroke="${t.dim}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 ${n(gap)}">`;
	ring += `<animate attributeName="stroke-dashoffset" from="0" to="-${n(gap)}" dur="${(SPIN / RING).toFixed(3)}s" repeatCount="indefinite"/></path>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${TITLE}">
<rect width="${W}" height="${H}" rx="12" fill="${t.bg}"/>
${ring}
<g transform="scale(.5)">
${tesseract(0, 1, 0.9)}
${tesseract(1, 0.5, 0.45)}
</g>
${copy()}
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
const file = new URL('banner.svg', OUT);
writeFileSync(file, svg());
console.log(file.pathname, (readFileSync(file).length / 1024).toFixed(0) + ' KB');

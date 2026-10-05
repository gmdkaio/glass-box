// Writes the module gallery in the README: an animated picture for every ready module,
// and the table of cards between the modules:start and modules:end markers.
// Run with: node scripts/readme-modules.mjs
//
// The pictures follow the banner's rule for <img>: few nodes, no embedded font, and
// only CSS keyframes on transform and opacity, which are cheap to redraw.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tracks, modules, where } from '../src/lib/modules.js';
import { TEXTS, tokenize } from '../src/lib/text-model.js';
import { WORDS, PROMPTS } from '../src/lib/sampling-sim.js';
import { chalk } from '../src/lib/colors.js';
import { CORPUS } from '../src/lib/tokenization-corpus.js';
import { loadEngine } from '../src/lib/engine.js';
import createModule from '../src/lib/wasm/glassbox.mjs';

const gb = await loadEngine(createModule);

const SITE = 'https://gmdkaio.github.io/glass-box';
const ASSETS = 'assets/modules';
const OUT = new URL(`../../.github/${ASSETS}/`, import.meta.url);
const README = new URL('../../README.md', import.meta.url);

const W = 600;
const H = 300;
const n = (x) => String(+x.toFixed(1));

function svg(css, body) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>text{font-family:ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace;fill:${chalk.dim};font-size:15px}.fb{transform-box:fill-box}${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<rect width="${W}" height="${H}" rx="10" fill="#09090b"/><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${chalk.divider}"/>
${body}
</svg>
`;
}

// keyframes that hold each value for its share of the cycle, then jump to the next
function steps(name, prop, values) {
	const k = values.length;
	// two decimals, or the hold's end rounds onto the next start and the browser fades instead
	const at = (x) => String(+x.toFixed(2));
	const frames = values.map((v, i) => `${at((i / k) * 100)}%,${at(((i + 1) / k) * 100 - 0.01)}%{${prop}:${v}}`);
	return `@keyframes ${name}{${frames.join('')}}`;
}

function softmax(scores) {
	const top = Math.max(...scores);
	const e = scores.map((s) => Math.exp(s - top));
	const sum = e.reduce((a, b) => a + b, 0);
	return e.map((x) => x / sum);
}

// a small seeded generator, so the pictures only change when the data does
function rng(seed) {
	return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

// How it works: the odds after each word of a sentence from the story text, counted
// as the page's word model counts them. The word that really comes next lights up.
function howItWorks() {
	const tokens = ['.', ...tokenize(TEXTS[0].text)];
	const sentence = ['the', 'cat', 'sat', 'on'];
	const after = ['.', ...sentence.slice(0, -1)];
	const BARS = 6;
	const rows = after.map((word, s) => {
		const counts = new Map();
		for (let i = 0; i + 1 < tokens.length; i++)
			if (tokens[i] === word) counts.set(tokens[i + 1], (counts.get(tokens[i + 1]) ?? 0) + 1);
		const total = [...counts.values()].reduce((a, b) => a + b, 0);
		const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, BARS);
		if (!top.some(([w]) => w === sentence[s])) top[BARS - 1] = [sentence[s], counts.get(sentence[s])];
		while (top.length < BARS) top.push(['', 0]);
		return top.map(([w, c]) => ({ p: c / total, picked: w === sentence[s] }));
	});
	const most = Math.max(...rows.flat().map((r) => r.p));
	const bx = 330, bw = 32, gap = 10, base = 200, top = 70;
	let css = '';
	let body = `<text x="32" y="42">read → score → pick → add</text>`;
	body += `<line x1="${bx - 8}" y1="${base}" x2="${bx + BARS * (bw + gap)}" y2="${base}" stroke="${chalk.line}"/>`;
	for (let j = 0; j < BARS; j++) {
		const x = bx + j * (bw + gap);
		css += steps(`b${j}`, 'transform', rows.map((r) => `scaleY(${n(r[j].p / most)})`));
		css += `.b${j}{transform-origin:50% 100%;animation:b${j} 8s infinite}`;
		css += steps(`h${j}`, 'opacity', rows.map((r) => (r[j].picked ? 1 : 0)));
		css += `.h${j}{animation:h${j} 8s infinite}`;
		body += `<rect class="fb b${j}" x="${x}" y="${top}" width="${bw}" height="${base - top}" fill="${chalk.line}"/>`;
		body += `<g class="h${j}"><rect class="fb b${j}" x="${x}" y="${top}" width="${bw}" height="${base - top}" fill="${chalk.bright}"/></g>`;
	}
	body += `<text x="${bx - 8}" y="${base + 22}">odds for the next word</text>`;
	sentence.forEach((word, s) => {
		css += steps(`w${s}`, 'opacity', sentence.map((_, i) => (i >= s ? 1 : 0)));
		css += `.w${s}{animation:w${s} 8s infinite}`;
		body += `<text class="w${s}" x="${32 + s * 62}" y="150" style="font-size:22px;fill:${chalk.bright}">${word}</text>`;
	});
	body += `<rect x="28" y="168" width="250" height="1" fill="${chalk.line}"/>`;
	body += `<text x="32" y="270">a tiny network, trained in your browser</text>`;
	return svg(css, body);
}

// Why answers vary: the odds for the clearer question on the sampling page, rolled
// twelve times. Each roll drops onto the word it picked and adds a tally mark.
function sampling() {
	const p = softmax([...PROMPTS[1].scores]);
	const random = rng(11);
	const rolls = Array.from({ length: 12 }, () => {
		let u = random();
		let i = 0;
		while (i < p.length - 1 && (u -= p[i]) > 0) i++;
		return i;
	});
	const bx = 60, bw = 70, gap = 30, base = 190, tall = 110;
	const dur = rolls.length * 0.75;
	let body = `<text x="32" y="42">${PROMPTS[1].text} … rolled 12 times</text>`;
	body += `<line x1="${bx - 10}" y1="${base}" x2="${bx + p.length * (bw + gap) - 20}" y2="${base}" stroke="${chalk.line}"/>`;
	p.forEach((v, j) => {
		const x = bx + j * (bw + gap);
		const h = Math.max(1, (v / Math.max(...p)) * tall);
		body += `<rect x="${x}" y="${n(base - h)}" width="${bw}" height="${n(h)}" fill="${chalk.line}"/>`;
		body += `<text x="${x}" y="${base + 20}">${WORDS[j]}</text>`;
	});
	let css = steps('die', 'transform', rolls.map((j) => `translate(${bx + j * (bw + gap) + bw / 2}px,0)`));
	css += `.die{animation:die ${dur}s infinite}`;
	css += `@keyframes drop{0%{transform:translateY(-26px);opacity:0}25%{opacity:1}55%,100%{transform:translateY(0);opacity:1}}`;
	css += `.drop{animation:drop .75s infinite ease-in}`;
	body += `<g class="die"><circle class="drop" cx="0" cy="${base - tall - 18}" r="7" fill="${chalk.bright}"/></g>`;
	const seen = p.map(() => 0);
	rolls.forEach((j, i) => {
		const slot = seen[j]++;
		css += steps(`t${i}`, 'opacity', rolls.map((_, k) => (k >= i ? 1 : 0)));
		css += `.t${i}{animation:t${i} ${dur}s infinite}`;
		const x = bx + j * (bw + gap) + (slot % 5) * 13;
		body += `<rect class="t${i}" x="${x}" y="${base + 34 + Math.floor(slot / 5) * 13}" width="9" height="9" fill="${chalk.soft}"/>`;
	});
	body += `<text x="32" y="276">one answer is one roll</text>`;
	return svg(css, body);
}

// Shrinking a model: 40 weights snap to the 4 values that 2 bits allow between -1 and
// 1 (the centres of 4 equal cells, as gb_snap picks them), hold, and go back.
function quantization() {
	const random = rng(7);
	const levels = [-0.75, -0.25, 0.25, 0.75];
	const mid = 150, half = 80;
	let css = `@keyframes snap{0%,20%{transform:translateY(0)}40%,75%{transform:translateY(var(--d))}95%,100%{transform:translateY(0)}}`;
	css += `@keyframes lv{0%,20%{opacity:.25}40%,75%{opacity:1}95%,100%{opacity:.25}}`;
	css += `.lv{animation:lv 6s infinite ease-in-out}.d{animation:snap 6s infinite cubic-bezier(.5,0,.3,1)}`;
	let body = `<text x="32" y="42">16 bits → 2 bits: each number snaps to 1 of 4 values</text>`;
	for (const v of levels) {
		const y = n(mid - v * half);
		body += `<line class="lv" x1="40" x2="560" y1="${y}" y2="${y}" stroke="${chalk.soft}" stroke-dasharray="3 5"/>`;
	}
	for (let i = 0; i < 40; i++) {
		const v = Math.max(-0.98, Math.min(0.98, (random() + random() + random() - 1.5) * 1.1));
		const q = levels.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
		const d = (v - q) * half;
		body += `<circle class="d" style="--d:${n(d)}px" cx="${n(52 + i * 12.6)}" cy="${n(mid - v * half)}" r="4" fill="${chalk.bright}"/>`;
	}
	body += `<text x="32" y="276">8x smaller, and you can see the rounding</text>`;
	return svg(css, body);
}

// Long tasks: one run of 20 steps at 95% each lights up step by step. The first
// wrong step spoils the rest, which stay dim, and the chance of a clean run is shown.
function compounding() {
	const STEPS = 20, P = 0.95, dur = 8;
	const random = rng(6); // a seed whose run slips at step 13, so the picture shows a break
	let wrong = -1;
	for (let i = 0; i < STEPS && wrong < 0; i++) if (random() >= P) wrong = i;
	const x0 = 32, size = 18, gap = 8, y = 110;
	let css = '';
	let body = `<text x="32" y="42">${STEPS} steps, each right ${P * 100}% of the time</text>`;
	for (let i = 0; i < STEPS; i++) {
		const on = n(4 + (i / STEPS) * 60), x = x0 + i * (size + gap);
		const lit = wrong >= 0 && i > wrong ? 0.2 : 1;
		css += `@keyframes s${i}{0%,${on}%{opacity:.12}${n(+on + 1)}%,92%{opacity:${lit}}100%{opacity:.12}}.s${i}{animation:s${i} ${dur}s infinite}`;
		body +=
			i === wrong
				? `<g class="s${i}"><rect x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}" fill="none" stroke="${chalk.bright}" stroke-width="2"/><path d="M${x + 5} ${y + 5}L${x + size - 5} ${y + size - 5}M${x + size - 5} ${y + 5}L${x + 5} ${y + size - 5}" stroke="${chalk.bright}" stroke-width="2"/></g>`
				: `<rect class="s${i}" x="${x}" y="${y}" width="${size}" height="${size}" fill="${chalk.bright}"/>`;
	}
	const odds = Math.round(P ** STEPS * 100);
	body += `<text x="32" y="190" style="font-size:24px;fill:${chalk.bright}">0.95^${STEPS} ≈ ${odds}%</text>`;
	body += `<text x="32" y="216">chance the whole task finishes clean</text>`;
	body += `<text x="32" y="276">checks between steps win it back</text>`;
	return svg(css, body);
}

// Context: the same question with more and more pasted text. Bars are each
// sentence's share of attention, the answer is the bright one, and its bar shrinks
// as sentences are added. Scores follow the page's toy: answer 4, two look-alikes
// 3.2, the rest seeded noise around 0.
function context() {
	const random = rng(3);
	const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
	const STAGES = [3, 8, 16, 32];
	const N = STAGES.at(-1);
	const KEY = 1;
	const scores = Array.from({ length: N }, () => normal());
	scores[KEY] = 4;
	scores[6] = 3.2;
	scores[13] = 3.2;
	const shares = STAGES.map((n) => softmax(scores.slice(0, n)));
	const x0 = 32, width = 536, base = 200, tall = 130, gap = 2;
	const bw = width / N - gap;
	let css = '';
	let body = `<text x="32" y="42">same question, more pasted text</text>`;
	body += `<line x1="${x0}" y1="${base}" x2="${x0 + width}" y2="${base}" stroke="${chalk.line}"/>`;
	for (let i = 0; i < N; i++) {
		const heights = shares.map((sh) => (i < sh.length ? sh[i] : 0));
		css += steps(`c${i}`, 'transform', heights.map((h) => `scaleY(${n(Math.max(h, 0.004))})`));
		css += steps(`o${i}`, 'opacity', heights.map((_, s) => (i < STAGES[s] ? 1 : 0)));
		css += `.c${i}{transform-origin:50% 100%;animation:c${i} 8s infinite,o${i} 8s infinite}`;
		const fill = i === KEY ? chalk.bright : scores[i] === 3.2 ? chalk.soft : chalk.line;
		body += `<rect class="fb c${i}" x="${n(x0 + i * (bw + gap))}" y="${base - tall}" width="${n(bw)}" height="${tall}" fill="${fill}"/>`;
	}
	const pct = shares.map((sh) => Math.round(sh[KEY] * 100));
	body += `<text x="32" y="236" style="font-size:20px;fill:${chalk.bright}">the answer's share: ${pct[0]}% → ${pct.at(-1)}%</text>`;
	body += `<text x="32" y="276">${STAGES.join(' → ')} sentences</text>`;
	return svg(css, body);
}

// Tokenization: the strawberry question cut by the page's tokenizer with more and
// more merges, from one chip per byte to whole words. Tokens come from the engine,
// trained on the page's corpus.
function tokenization() {
	const TEXT = "How many r's are in strawberry?";
	const pairs = gb.bpeTrain(CORPUS, 3000);
	const dec = new TextDecoder();
	const STAGES = [0, 30, 150, pairs.length / 2];
	const cw = 12.1, pad = 8, gap = 4, x0 = 32, width = 536, y0 = 62, row = 42;
	let css = '';
	let body = `<text x="32" y="42">the same question, as the model reads it</text>`;
	STAGES.forEach((k, s) => {
		const ids = gb.bpeEncode(TEXT, pairs, k);
		css += steps(`t${s}`, 'opacity', STAGES.map((_, i) => (i === s ? 1 : 0)));
		css += `.t${s}{animation:t${s} 8s infinite}`;
		let g = '';
		let x = x0, y = y0;
		ids.forEach((id, i) => {
			const label = dec.decode(gb.bpeTokenBytes(pairs, id)).replace(/ /g, '·');
			const w = label.length * cw + pad;
			if (x + w > x0 + width) {
				x = x0;
				y += row;
			}
			g += `<rect x="${n(x)}" y="${y}" width="${n(w)}" height="34" rx="4" fill="${i % 2 ? chalk.divider : chalk.grid}" stroke="${chalk.line}"/>`;
			g += `<text x="${n(x + pad / 2)}" y="${y + 24}" style="font-size:20px;fill:${chalk.bright}">${label}</text>`;
			x += w + gap;
		});
		const got = Array.from(ids).join(' ');
		g += `<text x="32" y="${y + row + 36}">model gets: ${got.length > 46 ? got.slice(0, got.lastIndexOf(' ', 45)) + ' …' : got}</text>`;
		g += `<text x="32" y="236" style="font-size:20px;fill:${chalk.bright}">${ids.length} tokens</text>`;
		g += `<text x="32" y="276">${k === 0 ? 'no merges: one token per byte' : `after ${k} merges`}</text>`;
		body += `<g class="t${s}">${g}</g>`;
	});
	return svg(css, body);
}

// Calibration: the page's "harder questions, wider gap" chart. How sure the model
// sounds (solid) and how often it is right (dashed), from very hard questions to easy
// ones, at the page's default boldness. The rings step from easy to very hard, and
// the numbers beside them change with each step. Answers come from the engine.
function calibration() {
	const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
	const at = (hard) => {
		const { conf, correct } = gb.calibSample(2000, hard, 1.2, 1.5, 1);
		return [avg(conf), avg(correct)];
	};
	const HARD = Array.from({ length: 31 }, (_, i) => -1.5 + (4.5 * i) / 30);
	const pts = HARD.map(at);
	const x0 = 40, width = 330, base = 236, tall = 190;
	const x = (h) => n(x0 + ((h + 1.5) / 4.5) * width);
	const y = (v) => n(base - v * tall);
	const line = (k) => HARD.map((h, i) => `${x(h)},${y(pts[i][k])}`).join(' ');
	let body = `<text x="32" y="28">harder questions, wider gap</text>`;
	body += `<line x1="${x0}" y1="${base}" x2="${x0 + width}" y2="${base}" stroke="${chalk.line}"/>`;
	body += `<polyline points="${line(0)}" fill="none" stroke="${chalk.bright}" stroke-width="3"/>`;
	body += `<polyline points="${line(1)}" fill="none" stroke="${chalk.soft}" stroke-width="3" stroke-dasharray="8 6"/>`;
	body += `<text x="${x0}" y="${base + 22}">very hard</text><text x="${x0 + width}" y="${base + 22}" text-anchor="end">easy</text>`;
	const STOPS = [3, 1.5, 0, -1.5];
	let css = '';
	STOPS.forEach((h, s) => {
		const [says, right] = at(h);
		css += steps(`q${s}`, 'opacity', STOPS.map((_, i) => (i === s ? 1 : 0)));
		css += `.q${s}{animation:q${s} 8s infinite}`;
		body += `<g class="q${s}"><circle cx="${x(h)}" cy="${y(says)}" r="8" fill="none" stroke="${chalk.bright}" stroke-width="2.5"/>`;
		body += `<circle cx="${x(h)}" cy="${y(right)}" r="8" fill="none" stroke="${chalk.bright}" stroke-width="2.5"/>`;
		body += `<text x="404" y="120" style="font-size:20px;fill:${chalk.bright}">says ${Math.round(says * 100)}%</text>`;
		body += `<text x="404" y="152" style="font-size:20px;fill:${chalk.soft}">right ${Math.round(right * 100)}%</text></g>`;
	});
	return svg(css, body);
}

const ART = { 'how-it-works': howItWorks, sampling, compounding, context, tokenization, calibration, quantization };

function card(m) {
	const at = where(m.slug);
	const label = [`${at.track.title} · ${at.n} of ${at.total}`, at.tag].filter(Boolean).join(' · ');
	const url = `${SITE}/${m.slug}`;
	return `<td width="50%" valign="top">
<a href="${url}"><img src=".github/${ASSETS}/${m.slug}.svg" alt="${m.title}" width="100%"></a><br>
<b><a href="${url}">${m.title}</a></b><br>
<sub>${label}</sub><br>
${m.blurb}
</td>`;
}

function gallery(ready) {
	const rows = [];
	for (let i = 0; i < ready.length; i += 2) {
		const pair = ready.slice(i, i + 2).map(card);
		if (pair.length === 1) pair.push('<td width="50%"></td>');
		rows.push(`<tr>\n${pair.join('\n')}\n</tr>`);
	}
	const soon = tracks
		.map((t) => {
			const left = modules.filter((m) => m.track === t.id && !m.ready).map((m) => m.title);
			return left.length ? `**${t.title}:** ${left.join(' · ')}` : '';
		})
		.filter(Boolean);
	return `<table>\n${rows.join('\n')}\n</table>\n\nComing next. ${soon.join('<br>\n')}`;
}

const ready = tracks.flatMap((t) => modules.filter((m) => m.track === t.id && m.ready));
mkdirSync(OUT, { recursive: true });
for (const m of ready) {
	if (!ART[m.slug]) throw new Error(`no README picture for ${m.slug}: add one to ART`);
	if (!m.blurb) throw new Error(`no blurb for ${m.slug}: add one in modules.js`);
	const file = new URL(`${m.slug}.svg`, OUT);
	writeFileSync(file, ART[m.slug]());
	console.log(file.pathname, (readFileSync(file).length / 1024).toFixed(1) + ' KB');
}

const START = '<!-- modules:start -->';
const END = '<!-- modules:end -->';
const readme = readFileSync(README, 'utf8');
const a = readme.indexOf(START);
const b = readme.indexOf(END);
if (a < 0 || b < a) throw new Error(`README needs ${START} and ${END} where the gallery goes`);
writeFileSync(README, readme.slice(0, a + START.length) + `\n${gallery(ready)}\n` + readme.slice(b));
console.log('README gallery:', ready.length, 'modules');

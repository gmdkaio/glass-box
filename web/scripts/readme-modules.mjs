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
import { PAGES, QUESTIONS, search } from '../src/lib/retrieval-sim.js';
import { budget as memBudget, MODELS as MEM_MODELS } from '../src/lib/memory-sim.js';
import { VOCAB as EMB_VOCAB, LABELS as EMB_LABELS, learn as embLearn, space as embSpace } from '../src/lib/embeddings-sim.js';
import { SPOTS as SET_SPOTS } from '../src/lib/settings-sim.js';
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

// the easing between keyframes: slow out, slow in, so every change glides
const EASE = 'cubic-bezier(.65,0,.35,1)';
const pc = (x) => `${+(x * 100).toFixed(2)}%`;
const run = (name, dur) => `.${name}{animation:${name} ${dur}s infinite ${EASE}}`;

// keyframes that hold each value for most of its share of the cycle, then ease into
// the next one; the last value eases back into the first
function tween(name, prop, values, hold = 0.75) {
	const k = values.length;
	const frames = values.map((v, i) => `${pc(i / k)},${pc((i + hold) / k)}{${prop}:${v}}`);
	return `@keyframes ${name}{${frames.join('')}100%{${prop}:${values[0]}}}`;
}

// opacity for scene s of k: shown during its hold, then it fades out in the first half
// of the gap and the next scene fades in during the second half, so text never overlaps
function scene(name, k, s, hold = 0.75) {
	const out = (s + hold) / k, gone = (s + hold + (1 - hold) / 2) / k;
	if (s === 0) return `@keyframes ${name}{0%,${pc(out)}{opacity:1}${pc(gone)},${pc(1 - (1 - hold) / 2 / k)}{opacity:0}100%{opacity:1}}`;
	const from = (s - 1 + hold + (1 - hold) / 2) / k;
	return `@keyframes ${name}{0%,${pc(from)}{opacity:0}${pc(s / k)},${pc(out)}{opacity:1}${pc(gone)},100%{opacity:0}}`;
}
// later scenes start hidden, so a still picture (reduced motion) shows only the first
const hidden = (s) => (s ? ' opacity="0"' : '');

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
		css += tween(`b${j}`, 'transform', rows.map((r) => `scaleY(${n(r[j].p / most)})`));
		css += `.b${j}{transform-origin:50% 100%}` + run(`b${j}`, 8);
		css += tween(`h${j}`, 'opacity', rows.map((r) => (r[j].picked ? 1 : 0)));
		css += run(`h${j}`, 8);
		body += `<rect class="fb b${j}" x="${x}" y="${top}" width="${bw}" height="${base - top}" fill="${chalk.line}"/>`;
		body += `<g class="h${j}"><rect class="fb b${j}" x="${x}" y="${top}" width="${bw}" height="${base - top}" fill="${chalk.bright}"/></g>`;
	}
	body += `<text x="${bx - 8}" y="${base + 22}">odds for the next word</text>`;
	sentence.forEach((word, s) => {
		// each word fades in as the bars move on to the odds after it
		if (s) css += tween(`w${s}`, 'opacity', sentence.map((_, i) => (i >= s ? 1 : 0))) + run(`w${s}`, 8);
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
	// each roll gets a slot: the ball drops, lands, leaves a mark and fades; a short
	// pause at the end clears the marks before the next round
	const SLOT = 0.75, PAUSE = 2, slots = rolls.length + PAUSE, dur = slots * SLOT;
	const at = (i) => i / slots;
	let body = `<text x="32" y="42">${PROMPTS[1].text} … rolled 12 times</text>`;
	body += `<line x1="${bx - 10}" y1="${base}" x2="${bx + p.length * (bw + gap) - 20}" y2="${base}" stroke="${chalk.line}"/>`;
	p.forEach((v, j) => {
		const x = bx + j * (bw + gap);
		const h = Math.max(1, (v / Math.max(...p)) * tall);
		body += `<rect x="${x}" y="${n(base - h)}" width="${bw}" height="${n(h)}" fill="${chalk.line}"/>`;
		body += `<text x="${x}" y="${base + 20}">${WORDS[j]}</text>`;
	});
	// the ball moves sideways only while it is hidden, between two drops
	const over = (j) => `translate(${bx + j * (bw + gap) + bw / 2}px,0)`;
	const moves = rolls.map((j, i) => `${pc(at(i))},${pc(at(i + 1) - 0.0001)}{transform:${over(j)};opacity:1}`);
	let css = `@keyframes die{${moves.join('')}${pc(at(rolls.length))},100%{transform:${over(rolls.at(-1))};opacity:0}}`;
	css += `.die{animation:die ${dur}s infinite linear}`;
	css += `@keyframes drop{0%{transform:translateY(-18px);animation-timing-function:cubic-bezier(.55,0,1,.45)}55%,100%{transform:translateY(0)}}`;
	css += `@keyframes glow{0%{opacity:0}20%,70%{opacity:1}100%{opacity:0}}`;
	css += `.drop{animation:drop ${SLOT}s infinite,glow ${SLOT}s infinite ease-out}`;
	body += `<g class="die"><circle class="drop" cx="0" cy="${base - tall - 12}" r="7" fill="${chalk.bright}"/></g>`;
	const seen = p.map(() => 0);
	rolls.forEach((j, i) => {
		const slot = seen[j]++;
		// the mark appears as the ball lands and stays until the pause
		const land = at(i + 0.55);
		css += `@keyframes t${i}{0%,${pc(land)}{opacity:0}${pc(at(i + 0.75))},${pc(at(rolls.length + 0.4))}{opacity:1}${pc(at(slots - 0.4))},100%{opacity:0}}`;
		css += `.t${i}{animation:t${i} ${dur}s infinite ease-out}`;
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
		css += `@keyframes s${i}{0%,${on}%{opacity:.12}${n(+on + 2.5)}%,90%{opacity:${lit}}100%{opacity:.12}}.s${i}{animation:s${i} ${dur}s infinite ease-out}`;
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
		css += tween(`c${i}`, 'transform', heights.map((h) => `scaleY(${n(Math.max(h, 0.004))})`));
		css += tween(`o${i}`, 'opacity', heights.map((_, s) => (i < STAGES[s] ? 1 : 0)));
		css += `.c${i}{transform-origin:50% 100%;animation:c${i} 8s infinite ${EASE},o${i} 8s infinite ${EASE}}`;
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
		css += scene(`t${s}`, STAGES.length, s) + run(`t${s}`, 8);
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
		body += `<g class="t${s}"${hidden(s)}>${g}</g>`;
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
	// stops are points of HARD (3, 1.5, 0, -1.5), so the rings sit exactly on the drawn lines
	const STOPS = [30, 20, 10, 0];
	const K = STOPS.length, HOLD = 0.75, MOVES = 16;
	// a point on line k at a fractional index into HARD
	const on = (k, f) => {
		const i = Math.min(Math.floor(f), HARD.length - 2), t = f - i;
		return [+x(HARD[i] + (HARD[i + 1] - HARD[i]) * t), +y(pts[i][k] + (pts[i + 1][k] - pts[i][k]) * t)];
	};
	const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
	let css = '';
	for (const k of [0, 1]) {
		const [sx, sy] = on(k, STOPS[0]);
		const to = ([px, py]) => `{transform:translate(${n(px - sx)}px,${n(py - sy)}px)}`;
		let frames = '';
		STOPS.forEach((f, s) => {
			frames += `${pc(s / K)},${pc((s + HOLD) / K)}${to(on(k, f))}`;
			// glide along the line to the next stop in short straight steps
			const next = STOPS[(s + 1) % K];
			for (let j = 1; j < MOVES; j++) frames += `${pc((s + HOLD + ((1 - HOLD) * j) / MOVES) / K)}${to(on(k, f + (next - f) * ease(j / MOVES)))}`;
		});
		css += `@keyframes g${k}{${frames}100%${to(on(k, STOPS[0]))}}.g${k}{animation:g${k} 8s infinite linear}`;
		body += `<circle class="g${k}" cx="${n(sx)}" cy="${n(sy)}" r="8" fill="none" stroke="${chalk.bright}" stroke-width="2.5"/>`;
	}
	STOPS.forEach((f, s) => {
		const [says, right] = pts[f];
		css += scene(`q${s}`, K, s, HOLD) + run(`q${s}`, 8);
		body += `<g class="q${s}"${hidden(s)}><text x="404" y="120" style="font-size:20px;fill:${chalk.bright}">says ${Math.round(says * 100)}%</text>`;
		body += `<text x="404" y="152" style="font-size:20px;fill:${chalk.soft}">right ${Math.round(right * 100)}%</text></g>`;
	});
	return svg(css, body);
}

// Retrieval: the first-bus question searched three ways. Bars are the top pages'
// search scores; the handed-over pages are bright, the right page is ticked, and the
// line under them says what the model most likely answers. Scores come from the engine.
function retrieval() {
	const q = QUESTIONS[0];
	const STAGES = [
		{ text: q.same, meaning: false, old: true, note: 'old timetable kept' },
		{ text: q.same, meaning: false, old: false, note: 'old timetable removed' },
		{ text: q.other, meaning: false, old: false, note: 'asked with other words' }
	];
	const k = 2, rows = 4, x0 = 32, barX = 250, barW = 260, y0 = 72, gap = 34;
	let css = '';
	let body = `<text x="32" y="36">the search picks the pages, the model answers from them</text>`;
	STAGES.forEach((st, s) => {
		const r = search(gb, st.text, st.meaning, st.old, k);
		const most = Math.max(r[0].score, 1e-9);
		const best = r.filter((x) => x.handed).sort((a, b) => b.share - a.share)[0];
		const said = best ? q.answers[best.page] ?? 'a guess' : 'a guess';
		css += scene(`r${s}`, STAGES.length, s) + run(`r${s}`, 9);
		let g = '';
		r.slice(0, rows).forEach((x, i) => {
			const y = y0 + i * gap;
			const bright = x.handed ? chalk.bright : chalk.line;
			const title = PAGES[x.page].title + (x.page === q.page ? ' ✓' : '');
			g += `<text x="${x0}" y="${y + 13}" style="fill:${x.handed ? chalk.bright : chalk.dim}">${title}</text>`;
			g += `<rect x="${barX}" y="${y}" width="${n(Math.max((x.score / most) * barW, 2))}" height="16" rx="2" fill="${bright}"/>`;
		});
		const right = best && best.page === q.page;
		g += `<text x="${x0}" y="236" style="font-size:20px;fill:${chalk.bright}">answers "${said}" ${right ? '✓' : '✗'}</text>`;
		g += `<text x="${x0}" y="270">${st.note}</text>`;
		body += `<g class="r${s}"${hidden(s)}>${g}</g>`;
	});
	return svg(css, body);
}

// Fitting in memory: Qwen3-32B at 4 bits on a 24 GB card while the chat grows. The
// bar is the model's numbers plus the context cache; the bright line is the card.
// At 32k tokens it no longer fits. Sizes come from the engine.
function memory() {
	const STAGES = [4096, 16384, 32768, 65536];
	const GIB = 1024 ** 3;
	const x0 = 32, width = 536, scale = width / (36 * GIB), y = 96, h = 56;
	const all = STAGES.map((ctx) => memBudget(gb, 2, 4, ctx, 24, 16));
	// the weights stay put; the cache stretches and pushes the overhead along
	const ww = all[0].weights * scale, ow = all[0].overhead * scale, c0 = all[0].cache * scale;
	let css = tween('mc', 'transform', all.map((b) => `scaleX(${n((b.cache * scale) / c0)})`)) + '.mc{transform-origin:0 50%}' + run('mc', 8);
	css += tween('mo', 'transform', all.map((b) => `translateX(${n(b.cache * scale - c0)}px)`)) + run('mo', 8);
	let body = `<text x="32" y="36">${MEM_MODELS[2].name} at 4 bits on a 24 GB card</text>`;
	body += `<rect x="${x0}" y="${y}" width="${n(ww)}" height="${h}" rx="3" fill="${chalk.bright}"/>`;
	body += `<rect class="fb mc" x="${n(x0 + ww + 2)}" y="${y}" width="${n(c0)}" height="${h}" fill="${chalk.soft}"/>`;
	body += `<rect class="mo" x="${n(x0 + ww + c0 + 4)}" y="${y}" width="${n(ow)}" height="${h}" fill="${chalk.line}"/>`;
	all.forEach((b, s) => {
		css += scene(`m${s}`, STAGES.length, s) + run(`m${s}`, 8);
		let g = `<text x="32" y="216" style="font-size:20px;fill:${chalk.bright}">${(b.total / GIB).toFixed(1)} GB ${b.fits ? 'fits ✓' : 'does not fit ✗'}</text>`;
		g += `<text x="32" y="250">${STAGES[s] / 1024}k tokens of chat: cache ${(b.cache / GIB).toFixed(1)} GB</text>`;
		body += `<g class="m${s}"${hidden(s)}>${g}</g>`;
	});
	const card = n(x0 + 24 * GIB * scale);
	body += `<line x1="${card}" y1="${y - 14}" x2="${card}" y2="${y + h + 14}" stroke="${chalk.bright}" stroke-width="3"/>`;
	body += `<text x="${card}" y="${y - 22}" text-anchor="middle" style="fill:${chalk.bright}">24 GB</text>`;
	return svg(css, body);
}

// Embeddings: the page's word map at 2, 3, 4 and 6 numbers per word. Each dot is a
// word, shaded by topic; a few words are named. The groups pull apart as numbers are
// added. Positions come from the engine, learned from the page's sentences.
function embeddings() {
	const learned = embLearn(gb);
	const STAGES = [2, 3, 4, 6];
	const SHADES = [chalk.bright, chalk.soft, chalk.dim, '#d4d4d8', '#52525b'];
	const NAMED = ['bus', 'coach', 'bread', 'cat', 'rain', 'town'];
	const x0 = 40, w = 330, y0 = 50, h = 210;
	let css = '';
	let body = `<text x="32" y="32">words used alike end up close</text>`;
	// each stage's map, scaled to 0..1 on both axes
	const maps = STAGES.map((k) => {
		const m = embSpace(gb, learned, k).map;
		let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
		for (let i = 0; i < m.length; i += 2) for (const d of [0, 1]) { lo[d] = Math.min(lo[d], m[i + d]); hi[d] = Math.max(hi[d], m[i + d]); }
		return EMB_VOCAB.map((_, i) => [0, 1].map((d) => (m[i * 2 + d] - lo[d]) / (hi[d] - lo[d] || 1)));
	});
	// a flat map can come out mirrored or with its axes swapped; keep the version closest
	// to the map before it, so each dot travels only as far as its meaning moved
	for (let s = 1; s < maps.length; s++) {
		const ways = [];
		for (const swap of [false, true])
			for (const fx of [false, true])
				for (const fy of [false, true])
					ways.push(maps[s].map(([a, b]) => {
						const [u, v] = swap ? [b, a] : [a, b];
						return [fx ? 1 - u : u, fy ? 1 - v : v];
					}));
		const cost = (m) => m.reduce((sum, [u, v], i) => sum + (u - maps[s - 1][i][0]) ** 2 + (v - maps[s - 1][i][1]) ** 2, 0);
		maps[s] = ways.reduce((a, b) => (cost(b) < cost(a) ? b : a));
	}
	const place = ([u, v]) => [x0 + u * w, y0 + h - v * h];
	EMB_VOCAB.forEach((word, i) => {
		const [sx, sy] = place(maps[0][i]);
		const moves = maps.map((m) => {
			const [px, py] = place(m[i]);
			return `translate(${n(px - sx)}px,${n(py - sy)}px)`;
		});
		css += tween(`d${i}`, 'transform', moves) + run(`d${i}`, 8);
		let g = `<circle cx="${n(sx)}" cy="${n(sy)}" r="4" fill="${SHADES[EMB_LABELS[i]] ?? chalk.line}"/>`;
		if (NAMED.includes(word)) g += `<text x="${n(sx + 7)}" y="${n(sy + 5)}" style="fill:${chalk.bright}">${word}</text>`;
		body += `<g class="d${i}">${g}</g>`;
	});
	STAGES.forEach((k, s) => {
		css += scene(`e${s}`, STAGES.length, s) + run(`e${s}`, 8);
		body += `<text class="e${s}"${hidden(s)} x="420" y="140" style="font-size:20px;fill:${chalk.bright}">${k} ${k === 1 ? 'number' : 'numbers'}</text>`;
	});
	body += `<text x="420" y="170">per word</text>`;
	return svg(css, body);
}

// Sampling settings: the odds for the next word at the page's open spot, then cut by
// top-k 5, top-p 0.9 and min-p 0.1 in turn. Cut words fade; the odds they leave are
// shared out, so the bars that stay grow. Every height comes from the engine.
function samplingSettings() {
	const spot = SET_SPOTS[1];
	const STAGES = [
		{ label: 'no filter', s: { topK: 0, topP: 1, minP: 0 } },
		{ label: 'top-k 5', s: { topK: 5, topP: 1, minP: 0 } },
		{ label: 'top-p 0.9', s: { topK: 0, topP: 0.9, minP: 0 } },
		{ label: 'min-p 0.1', s: { topK: 0, topP: 1, minP: 0.1 } }
	];
	const all = STAGES.map((st) => gb.sampleOdds(spot.scores, { temperature: 1, ...st.s }));
	const plain = all[0].odds;
	const top = Math.max(...all.flatMap((r) => [...r.odds]));
	const x0 = 32, bw = 27, gap = 7, base = 220, tall = 150;
	let css = '';
	let body = `<text x="32" y="36">${spot.text} …</text>`;
	body += `<line x1="${x0 - 4}" y1="${base}" x2="${x0 + 16 * (bw + gap)}" y2="${base}" stroke="${chalk.line}"/>`;
	spot.words.forEach((word, i) => {
		const h0 = Math.max(1, (plain[i] / top) * tall);
		const x = x0 + i * (bw + gap);
		// a cut bar keeps its height and fades; a kept bar grows to its share
		css += tween(`b${i}`, 'transform', all.map((r) => `scaleY(${n(r.odds[i] > 0 ? r.odds[i] / plain[i] : 1)})`)) + `.b${i}{transform-origin:50% 100%}` + run(`b${i}`, 10);
		css += tween(`o${i}`, 'opacity', all.map((r) => (r.odds[i] > 0 ? 1 : 0.15))) + run(`o${i}`, 10);
		body += `<g class="o${i}"><rect class="fb b${i}" x="${x}" y="${n(base - h0)}" width="${bw}" height="${n(h0)}" fill="${i >= spot.bad ? chalk.dim : chalk.soft}"/>`;
		body += `<text x="${x + bw / 2}" y="${base + 14}" text-anchor="end" transform="rotate(-50 ${x + bw / 2} ${base + 14})" style="font-size:12px">${word}</text></g>`;
	});
	STAGES.forEach((st, k) => {
		css += scene(`s${k}`, STAGES.length, k) + run(`s${k}`, 10);
		body += `<g class="s${k}"${hidden(k)}><text x="${W - 32}" y="36" text-anchor="end" style="font-size:20px;fill:${chalk.bright}">${st.label}</text>`;
		body += `<text x="${W - 32}" y="60" text-anchor="end">keeps ${all[k].kept} of 16</text></g>`;
	});
	return svg(css, body);
}

const ART = { 'how-it-works': howItWorks, sampling, compounding, context, tokenization, calibration, retrieval, quantization, memory, embeddings, 'sampling-settings': samplingSettings };

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

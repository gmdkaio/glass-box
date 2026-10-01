<script>
	import { onMount } from 'svelte';
	import { chalk } from '$lib/colors.js';
	import { formatCount } from '$lib/quantization-sim.js';

	// w: the model's numbers. t: the 4 numbers for the tesseract panes.
	// data: engine results from quantization-sim.js, null until the engine loads.
	let { w, t, data } = $props();
	let canvas;

	const WIDTH = 1900;
	const HEIGHT = 600;
	const DOTS_END = 1040;
	const CHOICES_X = 1255;
	const MISS_X = 1685;
	const CENTER_Y = 320;

	// the 16 corners of the [-1, 1] box, drawn as a frame
	const BOX = [];
	for (let i = 0; i < 16; i++) BOX.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);

	// 4D to 2D: turn in the x-w and y-z planes, then two perspective divides
	function rotation(a) {
		return { c1: Math.cos(a), s1: Math.sin(a), c2: Math.cos(a * 0.7), s2: Math.sin(a * 0.7) };
	}

	function project(x, y, z, v, r, cx, cy, scale) {
		const px = x * r.c1 - v * r.s1;
		const pw = x * r.s1 + v * r.c1;
		const py = y * r.c2 - z * r.s2;
		const pz = y * r.s2 + z * r.c2;
		const k = 1 / (2.8 - pw);
		const m = 1 / (3.6 - pz * k);
		return [cx + px * k * m * scale, cy + py * k * m * scale];
	}

	onMount(() => {
		const c = canvas.getContext('2d');
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let shown = null;
		let levels = [];
		let levelsOf = null;
		let shownT = Array.from(t);
		let angle = 0.5;
		let frame;

		function ring(x, y, r) {
			c.beginPath();
			c.arc(x, y, r, 0, 6.283);
			c.stroke();
		}

		function dot(x, y, r) {
			c.beginPath();
			c.arc(x, y, r, 0, 6.283);
			c.fill();
		}

		function frameEdges(r, cx, scale, alpha) {
			c.strokeStyle = chalk.dim;
			c.globalAlpha = alpha;
			c.lineWidth = 1.5;
			for (let i = 0; i < 16; i++)
				for (let j = 0; j < 4; j++) {
					const k = i ^ (1 << j);
					if (k < i) continue;
					const a = project(...BOX[i], r, cx, CENTER_Y, scale);
					const b = project(...BOX[k], r, cx, CENTER_Y, scale);
					c.beginPath();
					c.moveTo(a[0], a[1]);
					c.lineTo(b[0], b[1]);
					c.stroke();
				}
			c.globalAlpha = 1;
		}

		function drawDots() {
			const size = w.length;
			let top = 0;
			for (const v of w) top = Math.max(top, Math.abs(v));
			const x = (v) => 40 + ((v / top) * 0.5 + 0.5) * (DOTS_END - 80);

			if (!shown || shown.length !== size) shown = Float64Array.from(data.q);
			if (levelsOf !== data.q) {
				levels = [...new Set(data.q)];
				levelsOf = data.q;
			}

			c.lineWidth = 1;
			c.strokeStyle = chalk.grid;
			for (const v of levels) {
				c.beginPath();
				c.moveTo(x(v), 56);
				c.lineTo(x(v), 570);
				c.stroke();
			}
			for (let i = 0; i < size; i++) {
				shown[i] += (data.q[i] - shown[i]) * 0.14;
				const jitter = (i * 0.618034) % 1;
				const y0 = 78 + jitter * 150;
				const y1 = 548 - jitter * 150;
				c.strokeStyle = chalk.line;
				c.beginPath();
				c.moveTo(x(w[i]), y0);
				c.lineTo(x(shown[i]), y1);
				c.stroke();
				c.strokeStyle = chalk.soft;
				c.lineWidth = 2;
				ring(x(w[i]), y0, 6);
				c.lineWidth = 1;
				c.fillStyle = chalk.bright;
				dot(x(shown[i]), y1, 6);
			}
		}

		function drawChoices(r) {
			frameEdges(r, CHOICES_X, 700, 0.5);

			c.fillStyle = chalk.soft;
			c.globalAlpha = 0.55;
			const pts = data.cloud;
			for (let i = 0; i < pts.length; i += 4) {
				const p = project(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], r, CHOICES_X, CENTER_Y, 700);
				c.fillRect(p[0] - 1, p[1] - 1, 2, 2);
			}
			c.globalAlpha = 1;

			// the 1-bit corners stay on screen as a reference
			if (data.bits > 1) {
				c.strokeStyle = chalk.dim;
				c.lineWidth = 1.5;
				const k = data.corners;
				for (let i = 0; i < k.length; i += 4) {
					const p = project(k[i], k[i + 1], k[i + 2], k[i + 3], r, CHOICES_X, CENTER_Y, 700);
					ring(p[0], p[1], 5);
				}
			}

			const me = project(shownT[0], shownT[1], shownT[2], shownT[3], r, CHOICES_X, CENTER_Y, 700);
			const n = data.near;
			const to = project(n[0], n[1], n[2], n[3], r, CHOICES_X, CENTER_Y, 700);
			c.strokeStyle = chalk.bright;
			c.lineWidth = 2;
			c.beginPath();
			c.moveTo(me[0], me[1]);
			c.lineTo(to[0], to[1]);
			c.stroke();
			c.fillStyle = chalk.bright;
			dot(to[0], to[1], 9);
			ring(me[0], me[1], 9);
		}

		function drawMiss(r) {
			const scale = 1800;
			const rel = (p) => project(p[0] - t[0], p[1] - t[1], p[2] - t[2], p[3] - t[3], r, MISS_X, CENTER_Y, scale);

			c.fillStyle = chalk.soft;
			const nb = data.neighbours;
			for (let i = 0; i < nb.length; i += 4) {
				const p = rel([nb[i], nb[i + 1], nb[i + 2], nb[i + 3]]);
				dot(p[0], p[1], 4);
			}

			const to = rel(data.near);
			c.strokeStyle = chalk.bright;
			c.lineWidth = 2;
			c.beginPath();
			c.moveTo(MISS_X, CENTER_Y);
			c.lineTo(to[0], to[1]);
			c.stroke();
			c.fillStyle = chalk.bright;
			dot(to[0], to[1], 9);
			ring(MISS_X, CENTER_Y, 9);
		}

		function draw() {
			c.clearRect(0, 0, WIDTH, HEIGHT);
			if (data && w) {
				if (!still) angle += 0.007;
				for (let j = 0; j < 4; j++) shownT[j] += (t[j] - shownT[j]) * 0.08;
				const r = rotation(angle);

				drawDots();
				c.strokeStyle = chalk.divider;
				c.lineWidth = 1;
				c.beginPath();
				c.moveTo(DOTS_END, 0);
				c.lineTo(DOTS_END, HEIGHT);
				c.moveTo(1470, 0);
				c.lineTo(1470, HEIGHT);
				c.stroke();
				drawChoices(r);
				drawMiss(r);
			}
			frame = requestAnimationFrame(draw);
		}

		draw();
		return () => cancelAnimationFrame(frame);
	});
</script>

<div class="relative overflow-hidden rounded-lg border">
	<div
		role="img"
		aria-label="Left: each dot is one number in the model, moving to its nearest allowed value. Middle: every allowed result for four numbers. Right: the four numbers and the nearest allowed point."
	>
		<canvas
			bind:this={canvas}
			width={WIDTH}
			height={HEIGHT}
			class="block w-full"
			style="aspect-ratio: 19 / 6"
			aria-hidden="true"
		></canvas>
	</div>
	<div class="pointer-events-none absolute top-2.5 left-3.5 text-xs text-muted-foreground max-md:hidden">
		<b class="font-medium text-foreground">The model's numbers</b> · each dot is one
	</div>
	<div class="pointer-events-none absolute top-2.5 left-[55.5%] text-xs text-muted-foreground max-md:hidden">
		<b class="font-medium text-foreground">How many choices</b>
		{#if data}<br />{formatCount(data.count)} results{/if}
	</div>
	<div class="pointer-events-none absolute top-2.5 left-[78%] text-xs text-muted-foreground max-md:hidden">
		<b class="font-medium text-foreground">How far off</b>
		{#if data}<br />miss {data.dist.toFixed(2)}{/if}
	</div>
</div>

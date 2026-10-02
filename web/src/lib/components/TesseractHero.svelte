<script>
	import { onMount } from 'svelte';
	import { chalk } from '$lib/colors.js';
	import { BOX, EDGES, rotation, project } from '$lib/tesseract.js';

	// Placeholder animation for the home page: a turning tesseract inside a
	// smaller one, with its corners pulsing and a ring of dots circling it.
	let box;
	let canvas;

	const RING = 28;

	onMount(() => {
		const c = canvas.getContext('2d');
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let width = 0;
		let height = 0;
		let angle = 0.7;
		let beat = 0;
		let frame;

		// the canvas follows the size of its box, so nothing is stretched
		function resize() {
			const ratio = devicePixelRatio || 1;
			width = box.clientWidth;
			height = box.clientHeight;
			canvas.width = width * ratio;
			canvas.height = height * ratio;
			c.setTransform(ratio, 0, 0, ratio, 0, 0);
		}
		const watcher = new ResizeObserver(resize);
		watcher.observe(box);
		resize();

		function draw() {
			c.clearRect(0, 0, width, height);
			if (!still) {
				angle += 0.005;
				beat += 0.03;
			}
			const r = rotation(angle);
			const cx = width / 2;
			const cy = height / 2;
			const scale = Math.min(width, height) * 1.55;

			c.fillStyle = chalk.dim;
			for (let i = 0; i < RING; i++) {
				const a = (i / RING) * 6.283 + beat * 0.3;
				c.beginPath();
				c.arc(cx + Math.cos(a) * width * 0.4, cy + Math.sin(a) * height * 0.4, 2.5, 0, 6.283);
				c.fill();
			}

			// the big tesseract and the small one inside it
			for (const [size, alpha] of [
				[1, 0.9],
				[0.5, 0.45]
			]) {
				c.strokeStyle = chalk.line;
				c.globalAlpha = alpha;
				c.lineWidth = 1.5;
				const points = BOX.map((p) =>
					project(p[0] * size, p[1] * size, p[2] * size, p[3] * size, r, cx, cy, scale)
				);
				for (const [a, b] of EDGES) {
					c.beginPath();
					c.moveTo(points[a][0], points[a][1]);
					c.lineTo(points[b][0], points[b][1]);
					c.stroke();
				}
				c.globalAlpha = 1;
				c.fillStyle = chalk.bright;
				points.forEach((p, i) => {
					c.beginPath();
					c.arc(p[0], p[1], (size === 1 ? 4.5 : 2.5) + Math.sin(beat + i) * 1.3, 0, 6.283);
					c.fill();
				});
			}

			frame = requestAnimationFrame(draw);
		}

		draw();
		return () => {
			cancelAnimationFrame(frame);
			watcher.disconnect();
		};
	});
</script>

<div bind:this={box} class="relative h-full w-full">
	<canvas bind:this={canvas} class="absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>

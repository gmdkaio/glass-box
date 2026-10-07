<script>
	import { chalk } from '$lib/colors.js';
	import { eased } from '$lib/motion.svelte.js';
	import { t } from '$lib/i18n.svelte.js';

	// series: error per bit count from errorSeries(). bits: the current setting.
	let { series, bits } = $props();
	let canvas;

	// the rings slide between bit settings instead of jumping
	const at = eased(() => (series ? series.findIndex((s) => s.bits === bits) : null), 500);

	const WIDTH = 640;
	const HEIGHT = 260;

	$effect(() => {
		if (!series || !canvas) return;
		const c = canvas.getContext('2d');
		c.clearRect(0, 0, WIDTH, HEIGHT);

		// the bit counts are spaced evenly, like the slider stops
		const last = series.length - 1;
		const x = (i) => 30 + (i / last) * 590;
		const y = (v) => 12 + (1 - v) * (HEIGHT - 44);
		const logs = series.map((s) => Math.log10(s.mse));
		const top = Math.max(...logs);
		const bottom = Math.min(...logs);
		const error = (i) => (logs[i] - bottom) / (top - bottom);
		const memory = (i) => series[i].bits / 16;
		const here = at.current ?? -1;
		// a value between two settings, while the rings move
		const between = (f, k) => {
			const lo = Math.floor(k);
			return lo + 1 < series.length ? f(lo) + (f(lo + 1) - f(lo)) * (k - lo) : f(lo);
		};

		c.lineWidth = 1;
		c.strokeStyle = chalk.divider;
		c.fillStyle = chalk.dim;
		c.font = '18px monospace';
		series.forEach((s, i) => {
			c.beginPath();
			c.moveTo(x(i), 12);
			c.lineTo(x(i), HEIGHT - 30);
			c.stroke();
			c.fillText(s.bits, x(i) - 5 * String(s.bits).length, HEIGHT - 8);
		});

		c.strokeStyle = chalk.bright;
		c.lineWidth = 2.5;
		c.beginPath();
		series.forEach((s, i) => (i ? c.lineTo(x(i), y(memory(i))) : c.moveTo(x(i), y(memory(i)))));
		c.stroke();

		c.strokeStyle = chalk.soft;
		c.setLineDash([8, 7]);
		c.beginPath();
		series.forEach((s, i) => (i ? c.lineTo(x(i), y(error(i))) : c.moveTo(x(i), y(error(i)))));
		c.stroke();
		c.setLineDash([]);

		if (here >= 0) {
			c.strokeStyle = chalk.bright;
			c.lineWidth = 2;
			for (const v of [between(memory, here), between(error, here)]) {
				c.beginPath();
				c.arc(x(here), y(v), 9, 0, 6.283);
				c.stroke();
			}
		}
	});
</script>

<div role="img" aria-label={t('Memory rises with bits while rounding error falls.', 'A memória sobe com os bits enquanto o erro de arredondamento cai.')}>
	<canvas bind:this={canvas} width={WIDTH} height={HEIGHT} class="block w-full" aria-hidden="true"></canvas>
</div>

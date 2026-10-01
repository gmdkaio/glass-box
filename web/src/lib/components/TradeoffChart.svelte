<script>
	import { chalk } from '$lib/colors.js';

	// series: error per bit count from errorSeries(). bits: the current setting.
	let { series, bits } = $props();
	let canvas;

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
		const here = series.findIndex((s) => s.bits === bits);

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
			for (const v of [memory(here), error(here)]) {
				c.beginPath();
				c.arc(x(here), y(v), 9, 0, 6.283);
				c.stroke();
			}
		}
	});
</script>

<div role="img" aria-label="Memory rises with bits while rounding error falls.">
	<canvas bind:this={canvas} width={WIDTH} height={HEIGHT} class="block w-full" aria-hidden="true"></canvas>
</div>

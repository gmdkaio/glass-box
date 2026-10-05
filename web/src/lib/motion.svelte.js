// Shared motion for every chart: values that ease to their new numbers instead
// of jumping, and a sweep that plays a setting from one end to the other.

import { untrack } from 'svelte';
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Blends numbers, arrays of numbers (typed arrays too) and plain objects of them.
// Anything else, or arrays that changed length, jumps straight to the new value.
function blend(a, b) {
	if (typeof a === 'number' && typeof b === 'number') return (t) => a + (b - a) * t;
	if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return () => b;
	if (ArrayBuffer.isView(a) || Array.isArray(a)) {
		if (a.length !== b.length) return () => b;
		const parts = Array.from(b, (v, i) => blend(a[i], v));
		return (t) => parts.map((f) => f(t));
	}
	const keys = Object.keys(b);
	const parts = keys.map((k) => blend(a[k], b[k]));
	return (t) => Object.fromEntries(keys.map((k, i) => [k, parts[i](t)]));
}

// A value that follows get() and eases to each new result. Call it while a
// component is being set up, and read .current in the markup. duration may be a
// function, read on each change. The first real value (after null) shows at once,
// since there is nothing to ease from.
export function eased(get, duration = 450) {
	const tween = new Tween(get(), { easing: cubicOut, interpolate: blend });
	$effect.pre(() => {
		const value = get();
		untrack(() => {
			const ms = typeof duration === 'function' ? duration() : duration;
			tween.set(value, { duration: tween.current == null || value == null || still() ? 0 : ms });
		});
	});
	return tween;
}

// Plays a setting through a list of values, one every `ms`. set(value) is called
// for each; stop() halts it, and a component should call it when it goes away.
export class Sweep {
	playing = $state(false);
	#timer = null;

	play(values, ms, set) {
		this.stop();
		let i = 0;
		set(values[0]);
		this.playing = true;
		this.#timer = setInterval(() => {
			i += 1;
			if (i >= values.length) return this.stop();
			set(values[i]);
		}, ms);
	}

	toggle(values, ms, set) {
		if (this.playing) this.stop();
		else this.play(values, ms, set);
	}

	stop() {
		clearInterval(this.#timer);
		this.#timer = null;
		this.playing = false;
	}
}

// n evenly spaced values from a to b, both ends included
export function range(a, b, n) {
	return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

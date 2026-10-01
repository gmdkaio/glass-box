import { loadEngine } from '$lib/engine.js';

let engine;

// Loads the wasm once. Browser only, so call it from onMount.
export function getEngine() {
	engine ??= import('$lib/wasm/glassbox.mjs').then((m) => loadEngine(m.default));
	return engine;
}

// Settings for the long tasks page. Every chance and every run comes from the engine.

export { percent } from '$lib/sampling-sim.js';

// three task sizes; a step is anywhere the model can go wrong. pt: the same in Portuguese.
export const TASKS = [
	{ label: 'A quick answer', hint: 'reword a paragraph', steps: 3, pt: { label: 'Uma resposta rápida', hint: 'reescrever um parágrafo' } },
	{ label: 'A small feature', hint: 'a function and its tests', steps: 20, pt: { label: 'Uma funcionalidade pequena', hint: 'uma função e os testes dela' } },
	{ label: 'An agent session', hint: 'a bug fixed across a codebase', steps: 60, pt: { label: 'Uma sessão de agente', hint: 'um bug corrigido em vários arquivos do código' } }
];

export const MAX_STEPS = 100;
export const RETRIES = 3; // how often a caught section is done again before giving up
export const TRIALS = 1000;

// how often a check runs: 0 is no checks
export const CHECKS = [
	{ label: 'No checks', every: 0, pt: { label: 'Sem verificações' } },
	{ label: 'Every 10 steps', every: 10, pt: { label: 'A cada 10 passos' } },
	{ label: 'Every 5 steps', every: 5, pt: { label: 'A cada 5 passos' } },
	{ label: 'Every step', every: 1, pt: { label: 'A cada passo' } }
];

// what the engine writes for each thing that happens in a run
const EVENT = { RIGHT: 0, WRONG: 1, PASSED: 2, CAUGHT: 3 };
export const OUTCOME = { CLEAN: 0, BROKEN: 1, GAVE_UP: 2 };

// the chance of finishing clean at every task length, without checks and with them
export function curve(gb, p, every, catchRate) {
	const points = [];
	for (let n = 1; n <= MAX_STEPS; n++)
		points.push({
			n,
			plain: gb.chainOdds(p, n, 0, catchRate, RETRIES),
			checked: gb.chainOdds(p, n, every, catchRate, RETRIES)
		});
	return points;
}

// Replays a run's events one at a time. Returns the state after the first `upto`
// events: what each step looks like, what each check said, and the section the run
// is in. A step can be 'todo', 'right', 'wrong' or 'redo' (being done again).
export function replay(events, steps, every, upto) {
	const section = every > 0 ? every : steps;
	const cells = Array(steps).fill('todo');
	const checks = []; // one per section: { at, state: 'todo' | 'passed' | 'caught', redos }
	for (let start = 0; start < steps; start += section)
		checks.push({ at: Math.min(start + section, steps), state: 'todo', redos: 0 });

	let s = 0; // section
	let i = 0; // step inside the section
	for (let e = 0; e < upto && e < events.length; e++) {
		const ev = events[e];
		if (s * section >= steps) break; // events that do not fit these settings
		const start = s * section;
		const len = Math.min(section, steps - start);
		if (ev === EVENT.RIGHT || ev === EVENT.WRONG) {
			cells[start + i] = ev === EVENT.WRONG ? 'wrong' : 'right';
			i++;
			// without checks the run just goes on to the next step
			if (every === 0 && i === len) i = 0;
		} else if (ev === EVENT.PASSED) {
			checks[s].state = 'passed';
			s++;
			i = 0;
		} else if (ev === EVENT.CAUGHT) {
			checks[s].state = 'caught';
			checks[s].redos++;
			for (let k = start; k < start + len; k++) cells[k] = 'redo';
			i = 0;
		}
	}
	return { cells, checks: every > 0 ? checks : [] };
}

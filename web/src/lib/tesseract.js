// Drawing helpers for the 4D views. These only decide where to draw things.

// the 16 corners of the [-1, 1] box
export const BOX = [];
for (let i = 0; i < 16; i++) BOX.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);

// pairs of corner indexes that form the 32 edges
export const EDGES = [];
for (let i = 0; i < 16; i++)
	for (let j = 0; j < 4; j++) {
		const k = i ^ (1 << j);
		if (k > i) EDGES.push([i, k]);
	}

// 4D to 2D: turn in the x-w and y-z planes, then two perspective divides
export function rotation(a) {
	return { c1: Math.cos(a), s1: Math.sin(a), c2: Math.cos(a * 0.7), s2: Math.sin(a * 0.7) };
}

export function project(x, y, z, v, r, cx, cy, scale) {
	const px = x * r.c1 - v * r.s1;
	const pw = x * r.s1 + v * r.c1;
	const py = y * r.c2 - z * r.s2;
	const pz = y * r.s2 + z * r.c2;
	const k = 1 / (2.8 - pw);
	const m = 1 / (3.6 - pz * k);
	return [cx + px * k * m * scale, cy + py * k * m * scale];
}

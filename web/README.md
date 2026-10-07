# Glass Box web

The site: SvelteKit with Svelte 5, Tailwind and shadcn-svelte components, built as
static pages with `adapter-static`.

```sh
npm ci
npm run dev       # local server
npm run build     # static site in build/
npm run preview   # serve the build
```

## Layout

- `src/routes/<slug>/+page.svelte`: one page per module. `src/lib/modules.js` lists
  the modules in sidebar order.
- `src/lib/<module>-sim.js`: settings and the calls into the engine for a module.
- `src/lib/<module>-copy.js`: the text of a module, with its sources listed at the top.
- `src/lib/engine.js`: the wrapper around the wasm engine. The engine itself is
  built from `../engine` into `src/lib/wasm/` (see the main README).
- `scripts/`: write the README banner and module pictures.

## GitHub Pages

The deploy workflow ([deploy-web.yml](../.github/workflows/deploy-web.yml)) builds
with `BASE_PATH=/glass-box`, so links and assets work under the project path.

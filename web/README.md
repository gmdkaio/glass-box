# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.1 create --template minimal --no-types --add tailwindcss="plugins:none" --install bun web-new
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## GitHub Pages

This app is set up for GitHub Pages as a project site.

- The build uses `BASE_PATH=/<repo-name>` in CI so asset URLs work under `/glass-box`.
- `web/static/.nojekyll` is included so GitHub Pages serves SvelteKit’s `_app` assets.
- The deploy workflow lives in [.github/workflows/deploy-web.yml](../.github/workflows/deploy-web.yml).

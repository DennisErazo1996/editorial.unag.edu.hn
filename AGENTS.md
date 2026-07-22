# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Astro site for Editorial | Universidad Nacional de Agricultura (UNAG). Package manager is Bun (`bun.lock` present).

## Commands

- `bun install` — install dependencies
- `bun run dev` — dev server at `localhost:4321`
- `bun run build` — build to `./dist/`
- `bun run preview` — preview production build
- `bun run astro ...` — run Astro CLI (e.g. `bun run astro check`, `bun run astro add`)

When starting the dev server for yourself (not the user), use background mode: `astro dev --background`. Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`.

There is no test suite or linter configured in this repo.

## Architecture

- `src/pages/` — file-based routes (Astro pages). `index.astro` composes the site by importing components into `src/layouts/Main.astro`.
- `src/layouts/Main.astro` — root HTML shell (`<html>`/`<head>`/`<body>`), imports `src/styles/global.css`, sets page `<title>` and favicon.
- `src/components/astro/` — Astro components (e.g. `header.astro`, `footer.astro`) used to build page sections.
- `src/components/react/` — React components, wired up via the `@astrojs/react` integration in `astro.config.mjs`.
- `src/styles/global.css` — Tailwind CSS v4 entry point. Site design tokens (brand colors, font) are defined here via `@theme`, not in a `tailwind.config` file:
  - Colors: `unag-green`, `unag-dark-green`, `unag-light-green`, `unag-yellow`, `unag-overlay-green`, `unag-gray`, `unag-light-gray` — use these Tailwind color utilities (`bg-unag-*`, `text-unag-*`) instead of raw hex values.
  - Font: Montserrat is forced globally via `@layer utilities { * { font-family: ... !important } }`; `.texto-cursiva` opts into the "Nothing You Could Do" script font.
- Path aliases (`tsconfig.json`): `@/*` → `src/*`, `@assets/*` → `src/assets/*`.
- Tailwind is integrated via the Vite plugin (`@tailwindcss/vite`) in `astro.config.mjs`, not the Astro Tailwind integration.
- `public/img/` holds static image assets referenced by absolute path (e.g. `/img/bg-footer.jpg`).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

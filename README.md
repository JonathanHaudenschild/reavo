# Reavo

A custom block-based WordPress theme for Reavo, built with Tailwind CSS and Vite.

The theme includes reusable block patterns, responsive templates, custom styling,
and an interactive CPR simulation used on the front page.

## Features

- WordPress block templates and template parts
- Reusable hero, feature, team-member, and contact patterns
- Tailwind CSS styling compiled with Vite
- Interactive CPR simulation with sound and keyboard support
- Production packaging as an installable WordPress theme ZIP

## Requirements

- WordPress
- Node.js and npm
- `rsync` and `zip` for the packaging script

## Development

Install the frontend dependencies:

```bash
npm install
```

Start a development build that watches for changes:

```bash
npm run dev
```

Create an optimized production build:

```bash
npm run build
```

Compiled assets are written to `assets/build`.

## Install the theme

For local development, place this repository in `wp-content/themes/reavo`, build
the assets, and activate **Reavo** in the WordPress admin area.

To create an installable archive, run:

```bash
npm run package
```

The resulting file is written to `dist/reavo-theme.zip`.

## Project structure

```text
assets/       Frontend source, compiled CSS, JavaScript, fonts, and images
parts/        Header and footer template parts
patterns/     Reusable WordPress block patterns
templates/    Block theme templates
functions.php Theme setup, assets, block styles, and CPR modal
theme.json    Global WordPress theme settings and styles
```

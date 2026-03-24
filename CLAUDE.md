# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GeoDataVis is a Vue 3 + CesiumJS geospatial data visualization application for 3D globe rendering and geospatial data layers (WMS, WMTS, 3D Tiles, GeoJSON, Terrain).

## Working Environment

- Currently working on Windows 10 systems
- Reply in Chinese

## Common Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production builds
pnpm build              # Default production build
pnpm build:github-pages # GitHub Pages deployment build
pnpm build:local        # Local production build

# Preview production build
pnpm preview

# Code quality
pnpm lint      # Check ESLint issues
pnpm lint:fix  # Fix ESLint issues
pnpm format    # Format with Prettier
```

## Architecture

### Tech Stack
- **Vue 3** with Composition API (`<script setup>` syntax)
- **Pinia** for state management
- **CesiumJS** for 3D globe visualization (externalized in production)
- **Element Plus** for UI components
- **Vite** for build tooling
- **pnpm** as package manager

### Core Architecture Patterns

**Singleton Managers** (`src/map/`)
- `ViewerManager.js` - Single Cesium Viewer instance with custom camera controls
- `LayerManager.js` - Layer lifecycle management (add/remove/update visibility/opacity)

**State Management** (`src/stores/`)
- `layerStore.js` - Layer list state (use `markRaw` for Cesium instances)
- `terrainStore.js` - Terrain provider state
- `serviceConfigStore.js` - Persistent service configurations (localStorage)
- `panelStatus.js` - UI panel visibility state

**Data Flow**
1. User interactions trigger Pinia store actions
2. Stores call LayerManager methods
3. LayerManager creates/modifies Cesium primitives
4. UI components react to store state changes

### Cesium Integration Notes

**Externalization Strategy** (production builds)
- Cesium is externalized via `vite-plugin-externals` to reduce bundle size
- Static assets (Assets, Workers, ThirdParty, Widgets) are copied by `vite-plugin-static-copy`
- `window.CESIUM_BASE_URL` is set in `main.js` to locate static resources

**Coding Standards**
- Use Cesium enum constants, not numeric values (e.g., `LabelStyle.FILL_AND_OUTLINE` not `2`)
- Mark Cesium instances as `markRaw()` in stores to avoid Vue reactivity issues
- Viewer uses default offline TMS (NaturalEarthII) as base layer

### Directory Structure

```
src/
├── map/
│   ├── ViewerManager.js      # Cesium Viewer singleton
│   ├── LayerManager.js       # Layer management singleton
│   ├── business/             # Business logic (MassPointRenderer, etc.)
│   └── utils/                # Map utilities (WFS loader, validators, etc.)
├── stores/
│   ├── map/
│   │   ├── layerStore.js     # Layer state
│   │   └── terrainStore.js   # Terrain state
│   ├── panelStatus.js        # UI panel state
│   └── serviceConfigStore.js # Persistent configs
└── views/
    ├── MapContainer.vue      # Cesium container
    └── panels/               # UI panels and dialogs
```

## Key Configuration

**vite.config.js**
- Cesium externalization in production mode only
- Multiple build targets (default, github-pages, local)
- SCSS with modern compiler API

**Environment Variables** (`.env.*`)
- `VITE_BASE_URL` - Base URL for deployment (set to repo name for GitHub Pages)

**Cursor Rules**
Project has extensive Cursor rules in `.cursor/rules/` for:
- Cesium coding patterns (`cesium-rule.mdc`, `cesium-source-look-up.mdc`)
- Vue patterns (`vue-rule.mdc`)
- Architecture (`tech-architecture.mdc`, `repo-structure.mdc`)

## No Test Suite

This project currently has no configured test framework. When adding tests, consider Vitest for unit tests and Cypress for E2E tests.

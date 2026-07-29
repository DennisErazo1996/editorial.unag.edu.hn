# Ediciones Page Design Spec
**Date:** 2026-07-29  
**Status:** Approved  

## Overview
Page displaying all editions of the scientific journal. Hero section highlights the latest edition; scrollable list of past editions below.

## Purpose
- Archive/search past editions
- Download individual edition PDFs
- Showcase journal publication history

## Structure

### Page Layout
```
Header
  ↓
Hero Section (Latest Edition)
  ↓
List of Past Editions (stacked rows)
  ↓
Footer
```

### Hero Section: Latest Edition
**Purpose:** Prominently display most recent edition with download/view options

**Desktop Layout (Grid 2 columns):**
- Left: Cover image (~300px wide, aspect ratio 3:4, maintains proportions)
- Right: Edition info
  - Label: "Última edición" (yellow, xs-sm uppercase)
  - Title: "VOL. X (YYYY): [Subtitle]" (white, large)
  - Publication date: "Publicado: [date]" (white/80)
  - Description: 2-3 sentences (white/80)
  - Buttons: "Ver edición" + "Descargar PDF" (unag-green hover)

**Mobile Layout (Stacked):**
- Cover image full-width at top
- All info stacked below

**Styling:**
- Background: `bg-unag-dark-green` (pattern: `hero.astro`)
- Padding: `p-10 md:p-8`
- Rounded corners on cover image
- Button styling: consistent with existing site (green with hover state)

### List: Past Editions
**Purpose:** Chronological archive of previous editions

**Each Row:**
- Full-width container with padding and bottom border
- Desktop: Grid 2 columns (cover left, info right)
- Mobile: Stacked (cover top, info bottom)

**Cover (Left/Top):**
- Image: ~200-250px wide on desktop, full-width on mobile
- Aspect ratio: 3:4 (matches hero.astro pattern)
- Subtle shadow/border

**Info (Right/Bottom):**
- Title: Edition number and subtitle
- Date: Publication date
- Description: 1-2 sentences about theme/focus
- Stats: "N artículos | N autores" (inline or stacked)
- Buttons: "Ver edición" + "Descargar PDF" (same style as hero)

**Spacing:**
- Rows separated by border-bottom or margin
- Consistent padding across rows

## Data Structure

**Source:** Hardcoded array in `.astro` file (2 examples initially)

```typescript
interface Edition {
  volume: string;        // "VOL. 1 (2026)"
  title: string;         // Full edition title/theme
  date: string;          // Publication date
  description: string;   // 2-3 sentence description
  articles: number;      // Article count
  authors: number;       // Author count
  cover: string;         // Image path (e.g., /img/demo-portada.png)
  viewUrl: string;       // Link to view full edition
  downloadUrl: string;   // Link to download PDF
}

const editions: Edition[] = [
  { /* latest edition */ },
  { /* past edition */ },
  // ... more as available
];
```

**Initial Data:**
- Latest edition: VOL. 1 (2026) - Innovación agrícola y sostenibilidad (15 de marzo de 2026)
- Past edition: VOL. 1 (2025) - Seguridad alimentaria y agricultura sostenible (20 de agosto de 2025)

## Responsiveness

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (<768px) | Stacked layout (cover → info), full-width, single column |
| Desktop (≥768px) | Side-by-side grid (cover left, info right) |

## Components

**New/Modified:**
- `ediciones.astro` (new page)
  - Imports: Header, Footer, Main layout
  - Contains: hero section component + edition rows
  - Data: hardcoded editions array

**Reusable:**
- Can refactor hero + row into React component if editions grow dynamically later
- For now: inline Astro markup is acceptable

## Buttons & Links

**Buttons per edition:**
1. "Ver edición" - navigates to `/edicion/vol-X-YYYY` or similar
2. "Descargar PDF" - direct link to `/download/vol-X-YYYY.pdf`

**Styling:** Consistent with site (unag-green, hover state)

## Content Fields per Edition

Required:
- Volume/number (e.g., "VOL. 1 (2026)")
- Title/theme
- Publication date
- Cover image path
- Article count
- Author count
- View & download URLs

Optional (for future):
- Full description/editorial intro
- Table of contents link
- External links (ISSN, indexing databases)

## Future Extensibility

- When editions become database-driven: move data to content collection or API
- Add filtering/search if archive grows large
- Add "Quick stats" section (total articles published, etc.)
- Individual edition detail pages linked via "Ver edición"

## Constraints

- Use existing UNAG color tokens (unag-green, unag-dark-green, etc.)
- Follow Tailwind v4 utilities from `global.css`
- Responsive first (mobile experience essential)
- No external API calls (hardcoded data only for now)

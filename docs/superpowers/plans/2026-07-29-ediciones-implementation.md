# Ediciones Page Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scrollable editions archive page with hero section for latest edition and list of past editions, each showing cover + metadata + download/view buttons.

**Architecture:** Single Astro page (`ediciones.astro`) with hardcoded edition data. Hero section displays latest edition prominently; list below renders past editions in full-width rows. Responsive: desktop side-by-side (cover left, info right), mobile stacked (cover top, info bottom).

**Tech Stack:** Astro, Tailwind CSS v4, Lucide icons (for buttons/links), hardcoded data structure

---

## File Structure

- **Create:** `src/pages/ediciones.astro` — main page component
  - Imports: Header, Footer, Main layout, Lucide icons
  - Data: hardcoded editions array
  - Sections: hero (latest), list (past)
  - Styling: Tailwind utilities (responsive breakpoints)

---

## Task 1: Create Base Page Structure

**Files:**
- Create: `src/pages/ediciones.astro`

- [ ] **Step 1: Create ediciones.astro with imports and data structure**

```astro
---
import Footer from '@/components/astro/footer.astro';
import Header from '@/components/astro/header.astro';
import Main from '@/layouts/Main.astro';
import { Download, Eye } from 'lucide-astro';

interface Edition {
  volume: string;
  title: string;
  date: string;
  description: string;
  articles: number;
  authors: number;
  cover: string;
  viewUrl: string;
  downloadUrl: string;
}

const editions: Edition[] = [
  {
    volume: "VOL. 1 (2026)",
    title: "Innovación agrícola y sostenibilidad",
    date: "15 de marzo de 2026",
    description: "Un número dedicado a las prácticas agroecológicas, la seguridad alimentaria y las tecnologías emergentes aplicadas al campo hondureño.",
    articles: 12,
    authors: 24,
    cover: "/img/demo-portada.png",
    viewUrl: "/edicion/vol1-2026",
    downloadUrl: "/download/vol1-2026.pdf"
  },
  {
    volume: "VOL. 1 (2025)",
    title: "Seguridad alimentaria y agricultura sostenible",
    date: "20 de agosto de 2025",
    description: "Artículos enfocados en sistemas de producción sostenibles, conservación de recursos naturales y políticas agrarias para el desarrollo rural en Honduras.",
    articles: 8,
    authors: 18,
    cover: "/img/demo-portada.png",
    viewUrl: "/edicion/vol1-2025",
    downloadUrl: "/download/vol1-2025.pdf"
  }
];

const latestEdition = editions[0];
const pastEditions = editions.slice(1);
---

<Main>
  <Header />
  {/* Hero section will go here */}
  {/* Editions list will go here */}
  <Footer />
</Main>
```

- [ ] **Step 2: Verify file creates without errors**

Run: `bun run astro check` in project directory
Expected: No errors, file recognized as Astro page

- [ ] **Step 3: Navigate to page in browser**

Run: `bun run dev` (if not running)
Visit: `http://localhost:4321/ediciones`
Expected: Page loads without content (structure-only)

- [ ] **Step 4: Commit base structure**

```bash
git add src/pages/ediciones.astro
git commit -m "feat: create base ediciones.astro with data structure"
```

---

## Task 2: Build Hero Section (Latest Edition)

**Files:**
- Modify: `src/pages/ediciones.astro`

- [ ] **Step 1: Add hero section HTML after Header**

Replace the `{/* Hero section will go here */}` comment with:

```astro
<section class="relative bg-unag-dark-green">
  <div class="max-w-7xl mx-auto px-5 md:px-0 py-10 md:py-15">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
      {/* Cover image */}
      <div class="flex justify-center md:justify-start">
        <div class="relative">
          <div class="absolute -inset-2 rounded-2xl border border-white/15 -z-10"></div>
          <img 
            src={latestEdition.cover} 
            alt={latestEdition.title}
            class="max-h-[50vh] md:h-full md:max-h-[70vh] w-auto max-w-full aspect-3/4 object-cover rounded-2xl shadow-2xl"
          />
        </div>
      </div>

      {/* Info */}
      <div class="flex flex-col justify-center items-center text-center md:text-left md:items-start">
        <span class="text-unag-yellow text-xs md:text-sm font-bold uppercase tracking-widest mb-3">
          Última edición publicada
        </span>
        <h1 class="text-white text-3xl md:text-5xl font-bold leading-tight mb-4">
          {latestEdition.volume}: {latestEdition.title}
        </h1>
        <p class="text-white/80 text-xs md:text-sm mb-2">
          Publicado: {latestEdition.date}
        </p>
        <p class="text-white/80 text-sm md:text-base mb-6 max-w-md">
          {latestEdition.description}
        </p>
        
        {/* Stats */}
        <div class="flex gap-6 mb-8 text-white text-sm">
          <div>
            <span class="font-bold text-unag-yellow">{latestEdition.articles}</span> artículos
          </div>
          <div>
            <span class="font-bold text-unag-yellow">{latestEdition.authors}</span> autores
          </div>
        </div>

        {/* Buttons */}
        <div class="flex flex-col sm:flex-row gap-3">
          <a 
            href={latestEdition.viewUrl}
            class="inline-flex items-center justify-center gap-2 bg-unag-green hover:bg-unag-light-green text-white hover:text-unag-dark-green font-bold transition-colors text-sm px-5 py-2 rounded-full shadow-sm"
          >
            <Eye size={18} />
            Ver edición
          </a>
          <a 
            href={latestEdition.downloadUrl}
            class="inline-flex items-center justify-center gap-2 border border-unag-green hover:bg-unag-green text-white font-bold text-sm px-5 py-2 rounded-full transition-colors"
          >
            <Download size={18} />
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify hero renders in browser**

Visit: `http://localhost:4321/ediciones`
Expected: Hero section displays with latest edition cover (left), title, date, description, stats, buttons (desktop: side-by-side; mobile: stacked)

- [ ] **Step 3: Test responsive on mobile**

Open DevTools, toggle device emulation to iPhone 14 Pro (390px)
Expected: Cover stacked above info, buttons stack vertically

- [ ] **Step 4: Commit hero section**

```bash
git add src/pages/ediciones.astro
git commit -m "feat: add hero section for latest edition"
```

---

## Task 3: Build Editions List (Past Editions)

**Files:**
- Modify: `src/pages/ediciones.astro`

- [ ] **Step 1: Add editions list HTML after hero section**

Replace `{/* Editions list will go here */}` with:

```astro
<section class="bg-white">
  <div class="max-w-7xl mx-auto px-5 md:px-0 py-10 md:py-15">
    <h2 class="text-3xl md:text-4xl font-bold text-unag-dark-green mb-10">
      Ediciones anteriores
    </h2>

    <div class="space-y-8 md:space-y-10">
      {pastEditions.map((edition) => (
        <div class="border-b border-unag-light-gray pb-8 md:pb-10">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
            {/* Cover image */}
            <div class="flex justify-center md:justify-start">
              <img 
                src={edition.cover} 
                alt={edition.title}
                class="max-h-[40vh] md:max-h-[50vh] w-auto max-w-full aspect-3/4 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Info */}
            <div class="flex flex-col justify-start">
              <span class="text-unag-yellow text-xs font-bold uppercase tracking-widest mb-2">
                {edition.volume}
              </span>
              <h3 class="text-xl md:text-2xl font-bold text-unag-dark-green mb-2">
                {edition.title}
              </h3>
              <p class="text-unag-gray text-sm mb-3">
                Publicado: {edition.date}
              </p>
              <p class="text-unag-gray text-sm mb-6">
                {edition.description}
              </p>

              {/* Stats */}
              <div class="flex gap-6 mb-6 text-unag-dark-green text-sm font-semibold">
                <div>{edition.articles} artículos</div>
                <div>{edition.authors} autores</div>
              </div>

              {/* Buttons */}
              <div class="flex flex-col sm:flex-row gap-3">
                <a 
                  href={edition.viewUrl}
                  class="inline-flex items-center justify-center gap-2 bg-unag-green hover:bg-unag-light-green text-white hover:text-unag-dark-green font-bold transition-colors text-sm px-5 py-2 rounded-full shadow-sm"
                >
                  <Eye size={18} />
                  Ver edición
                </a>
                <a 
                  href={edition.downloadUrl}
                  class="inline-flex items-center justify-center gap-2 border border-unag-green hover:bg-unag-green text-unag-green hover:text-white font-bold text-sm px-5 py-2 rounded-full transition-colors"
                >
                  <Download size={18} />
                  Descargar PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify list renders in browser**

Visit: `http://localhost:4321/ediciones`
Expected: "Ediciones anteriores" section displays below hero with past editions in rows (cover left, info right on desktop)

- [ ] **Step 3: Test responsive on mobile**

DevTools mobile view (390px)
Expected: Each row stacks vertically (cover top, info bottom), buttons vertical

- [ ] **Step 4: Test all interactive elements**

- Click "Ver edición" link → should navigate to viewUrl
- Click "Descargar PDF" link → should navigate to downloadUrl
- Both work on hero and list rows

- [ ] **Step 5: Commit editions list**

```bash
git add src/pages/ediciones.astro
git commit -m "feat: add past editions list with stats and buttons"
```

---

## Task 4: Polish Styling & Responsive Fine-Tuning

**Files:**
- Modify: `src/pages/ediciones.astro`

- [ ] **Step 1: Verify spacing and alignment on multiple breakpoints**

Test viewports:
- Mobile 375px (smaller phones)
- Mobile 414px (iPhone 12 Pro Max)
- Tablet 768px
- Desktop 1024px

Expected behavior:
- All text readable
- Images scale appropriately
- Buttons never overlap
- No horizontal scroll on any viewport

- [ ] **Step 2: Check color contrast**

Visual inspection:
- Yellow text on dark green backgrounds → sufficient contrast
- White text on dark green → sufficient contrast
- Gray text on white → readable

- [ ] **Step 3: Verify button hover states**

Desktop browser:
- Hover "Ver edición" button → color change + smooth transition
- Hover "Descargar PDF" button → border/background fill transition
- Hover works on both hero and list items

- [ ] **Step 4: Test on actual device (if available)**

Phone/tablet (real device or simulator):
- Page loads fast
- Touch targets (buttons) are large enough
- No layout shift or jank

- [ ] **Step 5: Commit polish**

```bash
git add src/pages/ediciones.astro
git commit -m "feat: polish ediciones page styling and responsive behavior"
```

---

## Task 5: Verify Integration & Final QA

**Files:**
- Check: `src/pages/ediciones.astro`
- Check: Navigation links from header

- [ ] **Step 1: Verify page is accessible from navigation**

Check `src/components/astro/header.astro` for link to `/ediciones`
Expected: Link exists or will be added separately

- [ ] **Step 2: Full page visual QA**

Visit: `http://localhost:4321/ediciones`
Screenshot desktop view:
- Header renders
- Hero displays correctly
- Editions list flows well
- Footer visible at bottom

- [ ] **Step 3: Mobile QA (DevTools)**

DevTools mobile view 390px:
- All sections responsive
- No text cut off
- Buttons accessible
- Scrolling smooth

- [ ] **Step 4: Test all links**

- Hero "Ver edición" → `/edicion/vol1-2026`
- Hero "Descargar PDF" → `/download/vol1-2026.pdf`
- Past edition rows: same pattern

- [ ] **Step 5: Final commit**

```bash
git add src/pages/ediciones.astro
git commit -m "feat: complete ediciones page with full responsive QA"
```

---

## Summary

**Deliverable:** `src/pages/ediciones.astro` — fully functional editions archive page

**What it does:**
- Displays latest edition in hero section (dark green, side-by-side desktop / stacked mobile)
- Lists past editions in scrollable rows
- Each edition shows: cover, volume, title, date, description, article/author counts, view & download buttons
- Fully responsive: mobile stacked, desktop side-by-side
- Hardcoded 2-edition data (extensible for more)

**Not included (future work):**
- Individual edition detail pages (links point to `/edicion/*` URLs for future implementation)
- PDF download endpoints (links point to `/download/*` URLs for future implementation)
- Dynamic data from CMS/database
- Filtering/search

---

## Spec Coverage Checklist

✅ Hero section (latest edition) — Task 2  
✅ List of past editions — Task 3  
✅ Cover image (left desktop, top mobile) — Tasks 2, 3  
✅ Edition metadata (volume, title, date, description, article/author counts) — Tasks 2, 3  
✅ View & download buttons — Tasks 2, 3  
✅ Responsive design (mobile stacked, desktop side-by-side) — Tasks 3, 4  
✅ 2 hardcoded editions — Task 1  
✅ Color scheme (UNAG tokens) — Tasks 2, 3, 4  
✅ Tailwind v4 styling — Tasks 2, 3, 4  

No gaps identified.

# Fortone Ice Cream — Website

A premium, multi-page brand site for **Fortone Ice Cream**. Built with React, TypeScript and Vite. Motion runs on GSAP + ScrollTrigger, smooth scrolling uses Lenis, and the fonts are self-hosted variable fonts (Fraunces + Manrope).

**Pages:** Home · Flavours · Our Story · Visit · Contact · 404

**Motion & effects**
- First-load preloader, plus a two-layer curtain transition between pages
- A 3D-rendered hero film (desktop 16:9 and phone 9:16 cuts) that shrinks into a rounded frame as you scroll
- Headlines rise word by word, the manifesto text lights up as you read it, and images use parallax and clip reveals
- On desktop, vertical scroll drives a pinned horizontal flavour gallery
- An interactive flavour picker that changes the section colour and swaps the render with a spring
- Flavour cards tilt in 3D under the cursor, and a flavour opens in a detail dialog (deep-linkable as `/flavours?f=pistachio`)
- Magnetic buttons, a custom cursor on fine pointers, and a ticker that reacts to scroll velocity
- Everything respects `prefers-reduced-motion`. Revealed content stays keyboard-focusable.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # → dist/ (needs SPA fallback to index.html)
npm run build:static # → dist-static/ (hash routing, works on any static host or sub-folder)
```

## Editing content (no coding needed)

| File | What's in it |
| --- | --- |
| `src/config/site.ts` | Name, tagline, phone, WhatsApp, email, socials, locations (address, hours, Google Maps link) and SEO text. **Blank fields are hidden on the site.** |
| `src/config/flavors.ts` | Flavours (name, category, notes, description, colours, toppings, optional price) and the "Also on the counter" extras |
| `src/styles/tokens.css` | Brand colours, fonts, type scale and spacing. Change the palette here. |
| `src/components/Wordmark.tsx` | Placeholder logo. Swap in the official SVG. |

When `contact.whatsapp` (or `email`) is set, the contact form opens WhatsApp (or email) with the message already filled in. If neither is set, the send button stays disabled.

## Media (hero film + flavour renders)

Everything in `public/media` is rendered from a real-time 3D scene in `studio/` (three.js running in headless Chromium, then encoded with ffmpeg):

```bash
npm run render:media                        # everything (~10 min)
npm run render:media -- --only=stills       # flavour renders only
npm run render:media -- --only=hero-mobile  # one shot
npm run render:media -- --preview           # one frame of each shot into studio/out
```

Shots, colours and toppings live in `studio/shots.ts`. To add a flavour, add a still there and a matching entry in `flavors.ts`.

**Using real footage instead:** drop your clips in as `public/media/hero-desktop.mp4/.webm` (16:9) and `hero-mobile.mp4/.webm` (9:16), with a matching `-poster.webp` first frame. Keep each clip under ~4 MB and loop-friendly. No code changes are needed.

## Before launch — checklist

- [ ] Fill in `site.ts`: phone, WhatsApp, email, socials, address, opening hours, live domain
- [ ] Replace the placeholder story copy in `src/pages/Story.tsx` with the real story
- [ ] Confirm the flavour list and add prices in `flavors.ts`
- [ ] Swap in the official logo, and adjust `tokens.css` if the brand palette differs
- [ ] Optionally replace the rendered media with a real product shoot

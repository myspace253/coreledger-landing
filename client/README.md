# Coreledger — AI Research Terminal for Crypto Assets

Landing page for an AI investment-intelligence platform for crypto assets
(token address in → holder map, smart-money tracking, narrative benchmarking,
dev activity, contract risk, and a weighted AI risk score out).

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`, tokens in `src/index.css`)
- Motion (`framer-motion`) for entrance/hover micro-interactions
- GSAP + ScrollTrigger for scroll-driven reveals and the risk-bar fill animation
- Lenis for inertia smooth scrolling
- React Three Fiber + three.js for the hero wallet-network sphere

## Structure
```
src/
  App.tsx                 assembles the page + scroll-reveal hook
  index.css                design tokens (@theme) + base styles
  components/
    SmoothScroll.tsx       Lenis + GSAP ticker wiring
    NodeSphere.tsx          R3F wireframe wallet/whale network (hero)
    ReportTerminal.tsx      signature typewriter AI-report demo
    Modules.tsx              8 report modules grid
    RiskPanel.tsx            AI risk engine, scroll-triggered bars
    StackStrip.tsx           tech credit strip
    Footer.tsx                CTA
```

## Run it
```
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Notes for production
- Copy sits in `Modules.tsx`, `Footer.tsx`, and `App.tsx` — swap in real product copy freely, structure won't break.
- `ReportTerminal.tsx` is a scripted demo; wire it to your actual report-generation stream when the API is ready.
- The main JS bundle is ~1.3MB (three.js is the bulk of it). Before shipping, consider
  `React.lazy()` around `NodeSphere` so the 3D scene loads after first paint.

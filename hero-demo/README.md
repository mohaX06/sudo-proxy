# Hero gradient demo

A slow, subtle ShaderGradient background behind a hero section only, in the brand
colours cream `#FAF7F2` and warm orange `#D97757`.

```
npm install
npm run dev   # http://localhost:5173
```

The sliders in the bottom-right corner change the gradient live. When you like a
setting, copy the numbers into `DEFAULTS` in `src/HeroGradient.jsx`.

## Moving it into your site

1. Install: `npm i @shadergradient/react @react-three/fiber three@~0.186.0 three-stdlib camera-controls`
   - three is pinned below 0.187 because 0.187 removed a shader chunk
     (`cube_uv_reflection_fragment`) that ShaderGradient 2.4.20 still uses.
   - Next.js 15 App Router needs React 19 and @react-three/fiber 9.
2. Copy `src/HeroGradient.jsx`.
3. Make the hero `position: relative; overflow: hidden; isolation: isolate;` and render
   `<HeroGradient />` as its first child. In Next.js, put `'use client'` at the top
   of the file.

The built-in `grain` prop is off on purpose: it shifted the exposure of the whole
gradient. The grain is a CSS noise overlay instead, and `grain` in `DEFAULTS`
is its opacity. Users who prefer reduced motion get a still gradient.

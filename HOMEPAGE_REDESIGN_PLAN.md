# Homepage Redesign Plan

Target page: public landing page at `/`

Primary implementation files:

- `src/components/Landing.jsx`
- `src/components/Landing.css`
- `src/styles/design-tokens.css`

Protected dashboard note: `src/components/Home.jsx` is the authenticated app dashboard and is intentionally out of scope.

## 1. Original Visual Direction

The new Decipher landing page will use a premium, dark, immersive AI storytelling system called **Luminous Story Engine**.

The direction keeps the requested white/purple brand family but rebuilds the page around a product-first storytelling experience:

- Deep black and midnight-purple backgrounds
- Bright white text with clear opacity levels
- Purple as the main brand accent
- Soft violet, lavender, and blue-violet glows
- Layered narrative-path motifs
- Product UI previews instead of a generic hero image
- Cinematic panels, prompt cards, branching choice chips, and world cards
- Restrained motion focused on reveal, hover, active state, and ambient atmosphere

## 2. Why It Fits An AI Storytelling Product

Decipher is not just a writing tool; it is an interactive story engine. The landing page should make users understand the product through the first screen:

- Start with an idea
- Watch the AI create a scene
- Choose what happens next
- Build characters, worlds, and scenarios
- Continue adventures across sessions

The interface should feel like a doorway into a playable story, not a static SaaS brochure.

## 3. How It Differs From The Competitor

The competitor reference uses a fantasy-game launch style with black/gold coloring, angular controls, branded fantasy illustration, and rune-like motifs.

Decipher will differ by using:

- Purple/white brand direction instead of gold/black
- Original live product mockups instead of competitor-style fantasy splash art
- Soft portal, map-line, and branching-choice motifs instead of rune assets
- Modern AI interface language instead of medieval/adventure branding
- Rounded but restrained panels instead of angular clipped button shapes
- A different section order focused on prompt-to-play product storytelling
- Original copy, scenario names, visual assets, and UI patterns

## 4. Design Tokens Created

The new token file defines additive `--hp-*` variables so the landing page can be redesigned without destabilizing the app shell or dashboard.

Token groups:

- Color: background, elevated surfaces, borders, text, purple accents, state colors
- Typography: display, section, body, label, and button rules
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- Radius: controls, buttons, compact cards, feature cards, hero panels
- Shadows/glows: subtle elevation, purple glow, inset highlight
- Motion: fast, standard, entrance durations with premium easing
- Reduced motion: content remains visible and continuous decorative movement stops

## 5. Planned Homepage Sections

### Premium Navigation

Before: Logo, nav links, and signup button sit over a video hero in the existing purple/blue theme.

After: Minimal fixed glass nav with brand, concise anchor links, sign-in, and a strong `Start creating` CTA. The nav keeps white/purple styling and gains consistent focus states.

### Hero Section

Before: Large video background, centered wordmark, stats, and two CTAs.

After: Product-first hero with headline, supporting copy, primary/secondary CTAs, story stats, and a layered AI story session preview showing a prompt, generated scene, choices, character/world metadata, and an active composer.

### Interactive Product Showcase

Before: Art style carousel focuses more on generated imagery than the play loop.

After: A realistic AI storytelling interface shows how Decipher turns a prompt into narrative, player choices, memory, tone, and next action. This makes the product concrete.

### Features And Value Proposition

Before: Four similar feature cards.

After: A varied feature layout: one large world-building panel, two compact feature cards, and one horizontal continuation/session card. This avoids a generic card row.

### World And Genre Discovery

Before: Community cards with existing art style images.

After: Original genre/world cards using existing Decipher-generated images and new overlay treatments. Cards emphasize fantasy, sci-fi, mystery, and romance/adventure without using competitor assets.

### Final CTA

Before: Centered CTA panel with similar purple gradient treatment.

After: Strong conversion band built around a simple narrative choice line and clear CTA. It feels like the start of a game session.

### Footer

Before: Multi-column footer with mixed links.

After: Cleaner compact footer aligned with the new token system and brand treatment.

## 6. Component-Level Redesign Plan

- `Nav`: Fixed glass navigation with skip-friendly anchors, account action, and CTA.
- `Hero`: Product-forward split composition with original story preview instead of decorative-only media.
- `StoryPreview`: Mock story session panel with generated narrative, choice chips, and prompt composer.
- `MetricPill`: Compact trust/value stats below hero copy.
- `Showcase`: Product demonstration grid with scene response, AI memory, and choice mechanics.
- `FeatureMosaic`: Varied product benefit blocks with different visual weights.
- `WorldCard`: Genre cards using Decipher assets, gradient overlays, and clear labels.
- `FinalCTA`: Conversion section with narrative framing and two clear actions.
- `Footer`: Small brand footer with product links and social link.

## 7. Implementation Rules

- Keep routes, auth behavior, data fetching, and state management intact.
- Do not add dependencies.
- Reuse existing React, CSS, inline SVGs, and public assets.
- Do not use competitor assets, copy, or identifiable layout patterns.
- Keep keyboard focus states visible.
- Use semantic HTML where possible.
- Support responsive desktop, tablet, and mobile layouts.
- Respect `prefers-reduced-motion`.
- Use no lorem ipsum.


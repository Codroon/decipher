# Competitor Design Audit

Reference reviewed: `/Users/ghausmalik/Projects/Decipher/aidungeon-clone`

Primary files reviewed:

- `index.html`
- `styles.css`
- `assets/`

Important project constraint for Decipher: the final landing page should remain in the product's broad white/purple brand direction, but the current homepage layout, components, visual treatment, motion, cards, and typography can be rebuilt completely. This audit is for design principles only.

## 1. Overall Visual Direction

The competitor reference is a dark, cinematic, fantasy-adventure landing page with an editorial game-site feel. It is not a generic SaaS layout. It leans into entertainment, fantasy, and game identity through a full-screen illustrated hero, dramatic black overlays, angular button silhouettes, textured section backgrounds, and large story-driven sections.

The page feels more like a premium game/product launch page than a productivity app. It creates a mood of adventure, mystery, and immediacy. The user is placed in the fantasy world before being asked to read much.

The design quality comes from:

- A strong above-the-fold visual anchor
- Clear CTA hierarchy
- Confident type and spacing
- Custom button silhouettes instead of default rounded SaaS buttons
- Section transitions that feel authored rather than stacked
- Texture, depth, and atmosphere
- Repeated visual motifs such as angled edges, gold accents, dark panels, and fantasy art

## 2. Color System

The reference is dark-mode-first.

Observed colors and strategies:

- Main background: near-black `#000`
- Primary accent: warm gold `#ffb83c`
- Primary text: white `#fff`
- Secondary text: soft white overlays such as `rgba(255, 255, 255, 0.82)` and `rgba(255, 255, 255, 0.86)`
- Muted text: lower-opacity white such as `rgba(255, 255, 255, 0.45)`
- Card surfaces: charcoal and near-black, including `#171819` and `#373737`
- Texture sections: dark teal/green-black overlays such as `rgba(7, 24, 25, 0.8)`
- Hero overlays: layered black gradients with different opacities for contrast and cinematic depth
- Borders: subtle desaturated grey/white strokes, often low opacity
- CTA text contrast: dark text on gold for the primary button; gold text and gold border for secondary buttons

The color strategy is simple and disciplined: black foundation, white typography, one warm accent, and atmospheric overlays. The polish comes from restraint, not many colors.

For Decipher, we should adapt the strategy, not the palette. The useful principle is: keep a dark foundation, use white text with clear opacity levels, and reserve purple/white accents for meaningful emphasis.

## 3. Typography System

The reference loads:

- `IBM Plex Serif` for most display and body text
- `IBM Plex Sans` for footer brand/link text

Typography characteristics:

- Serif typography gives the page a fantasy/editorial identity.
- Body and heading text share the same serif family, creating a cohesive storybook/game feel.
- Hero logo is image-based rather than live text.
- Hero tagline is compact, bold, centered, and high contrast.
- Section headings are around `33px`, heavy, and use generous vertical spacing.
- Body text is generally `16px`, with line-height around `1.5`.
- Buttons are `16px`, heavy, uppercase, and intentionally compact.
- Navigation links are `16px`, using icon + label pairs.
- Eyebrows are uppercase labels placed in custom clipped white badges.

Hierarchy is created through weight, contrast, whitespace, and visual placement rather than a large complex type scale.

For Decipher, a stronger type personality would help. The current app uses Poppins/Spectral/Inter. We can keep existing fonts if useful, but should make the landing typography feel more deliberate: larger display scale, tighter heading rhythm, clear body opacity levels, and premium CTA type.

## 4. Spacing and Layout Rhythm

Observed layout patterns:

- Top navigation height: `72px`
- Main content width: `min(1016px, calc(100vw - 48px))`
- Page gutters: usually `24px`
- Hero: full viewport height with a minimum height of `760px`
- Large section spacing: many sections use `128px` to `192px` vertical padding
- Cards often use `48px` to `56px` internal padding
- Scenario grid gap: `32px`
- CTA button gap: `32px`
- Mobile gutters tighten to `16px` to `18px`

The spacing is intentionally theatrical. Sections are not treated as compact SaaS content blocks. They have enough space for mood and composition.

The layout also uses overlap and angled clipping:

- The gameplay section overlaps upward from the hero.
- Several sections use clipped polygon edges.
- Step cards are staggered vertically rather than placed in a flat equal row.

For Decipher, the adaptable principle is authored rhythm: vary section composition, avoid generic equal-card rows everywhere, and use spacing to create scenes.

## 5. Buttons and Controls

The reference buttons are one of the strongest identity elements.

Primary CTA:

- Gold filled background
- Dark text
- Heavy uppercase serif text
- Tall button height around `69px`
- Angled/irregular polygon shape using `clip-path`
- Decorative offset border layer
- Hover scales up to around `1.05`
- No heavy glow; the shape and color carry the emphasis

Secondary CTA:

- Transparent fill
- Gold text
- Gold angular border treatment
- Similar height and silhouette to the primary button
- Clearly lower emphasis while still feeling custom

Navigation sign-in:

- Smaller version of the same angular gold treatment
- Fixed width and height
- Offset border gives it a crafted, game-like quality

Other controls:

- Circular gold play buttons in scenario cards
- Simple triangular play mark built with CSS borders
- Active nav link uses gold color and a custom underline image

For Decipher, the design principle worth adapting is a distinctive button system. We should avoid copying the angular gold clip-path design, but we should create CTAs that feel designed specifically for an AI storytelling/game product rather than default rounded buttons.

## 6. Cards, Panels, and Surfaces

Observed surface patterns:

- Cards are dark and simple, usually flat charcoal surfaces.
- Borders are visible but low contrast.
- Step cards are large and editorial, not small feature tiles.
- Scenario cards are text-heavy but readable, with a clear play affordance.
- Some cards use slight skew/tilt for hand-crafted energy.
- Large internal padding makes cards feel premium and intentional.
- Depth is created more through composition, overlap, texture, and border treatment than through big shadows.

The cards avoid generic styling by using:

- Irregular or angled borders
- Large story-oriented text blocks
- A dedicated play control
- Uneven vertical placement
- Strong contrast against black surroundings

For Decipher, cards can be rebuilt as immersive story/world surfaces: prompt panels, choice cards, world cards, character chips, or AI response panels. They should not simply be identical glass cards in a row.

## 7. Header and Navigation

Header characteristics:

- Fixed at the top
- Height `72px`
- Transparent-to-black gradient background
- Left brand area with logo image
- Compact nav links with icons
- Right-aligned sign-in CTA
- Minimal number of links
- Mobile navigation reduces to centered icon+label links and hides sign-in

The header works because it supports the hero instead of becoming a separate heavy bar. It is visually integrated into the cinematic top section.

For Decipher, the principle to adapt is a premium, low-noise nav that lets the hero carry the emotion while still offering a clear conversion action.

## 8. Hero Section and Product Presentation

The hero is highly visual:

- Full-screen fantasy artwork
- Large centered logo/wordmark
- Short tagline under the logo
- Primary and secondary CTAs directly below
- Dark overlay gradients to keep text readable
- A scroll prompt below the CTA area
- Strong foreground/background separation through shadow and opacity

The hero does not explain the product in detail. It sells the feeling first, then the following sections explain the product.

The reference uses brand art as the core hero focal point. For Decipher, the hero should instead show an original product-relevant visual: a prompt composer, AI-generated scene preview, branching choices, world state, or interactive story session. This would communicate the product without relying on a competitor-style fantasy splash image.

## 9. Motion and Micro-Interactions

The reference uses very restrained motion.

Observed animation and interaction:

- Scroll prompt bobbing animation: `3s ease-in-out infinite`
- CTA hover scale: `transform 0.3s ease`
- Hero has no complex JS motion
- No animation libraries detected
- No scroll reveal system detected
- No parallax JavaScript detected
- Mobile simplifies layout rather than adding animation

The polish comes more from layout and visual design than motion. This is important: it proves the page does not need heavy animation to feel premium.

For Decipher, subtle CSS motion is enough:

- Light section reveal
- Button hover/press feedback
- Product preview typing or active-state hint
- Gentle ambient background movement
- Reduced-motion support

## 10. Iconography and Imagery

Iconography:

- Simple image icons in nav
- CSS-created play triangles
- No general-purpose icon library
- Icons are small and subordinate to text

Imagery:

- Dominated by fantasy illustration assets
- Full-screen hero art
- Guide character illustration in a section
- Rune wheel layered assets
- Texture image for atmospheric section surfaces
- Final CTA background image

Decorative motifs:

- Runes
- Fantasy character art
- Section texture
- Angular clipped shapes
- Gold active marks

For Decipher, we must avoid copying these assets and motifs directly. The adaptable principle is to create a coherent visual language: narrative paths, world portals, prompt interfaces, branching choices, stars, maps, or AI-generated world layers.

## 11. Design Principles to Adapt

- Dark-mode-first atmosphere with high text contrast
- One disciplined accent system instead of many competing colors
- Strong first viewport with a clear emotional hook
- Product/game identity instead of generic SaaS styling
- Custom CTA treatment that feels proprietary
- Clear primary/secondary CTA hierarchy
- Large, confident spacing rhythm
- Section compositions that vary across the page
- Textured or layered backgrounds used with restraint
- Story-specific cards and panels instead of generic feature tiles
- Compact navigation that supports the hero
- Minimal motion focused on affordance and polish
- Mobile simplification that preserves CTA clarity
- Editorial typography hierarchy with readable body text

## 12. Elements to Avoid Copying

- AI Dungeon logo, name, wordmark, or brand references
- Latitude branding
- Exact gold/black color palette as the final Decipher system
- The exact hero composition with a centered competitor wordmark over fantasy art
- Competitor copywriting
- Competitor section order
- Competitor scenario names and examples
- Competitor assets: hero art, rune wheel, guide character, textures, icons, final background, wordmark, underline image
- Exact angular button shapes and clipped polygon details
- Exact card layout and stagger positions
- Exact typography pairing and identity
- Footer content, brand, and link structure

## Decipher-Specific Takeaway

The competitor feels polished because every visual decision supports one product feeling: cinematic fantasy adventure. Decipher should do the same for AI storytelling and interactive choice, but in its own brand language.

For the redesign, Decipher should keep the broad white/purple identity requested by the owner, while replacing the current landing page with a more premium system:

- Dark atmospheric foundation
- White text with clear hierarchy
- Purple as the primary brand accent
- Original secondary accent if needed
- Product-first hero preview
- Branching-choice storytelling motifs
- Distinctive buttons and panels
- More varied section composition
- Subtle CSS-based motion
- No competitor assets, copy, layout, or identifiable brand patterns

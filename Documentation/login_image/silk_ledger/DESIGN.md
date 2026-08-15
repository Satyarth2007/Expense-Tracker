---
name: Silk Ledger
colors:
  surface: '#fcf9f6'
  surface-dim: '#dcdad7'
  surface-bright: '#fcf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f0'
  surface-container: '#f0edea'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e5e2df'
  on-surface: '#1c1c1a'
  on-surface-variant: '#4c463d'
  inverse-surface: '#31302f'
  inverse-on-surface: '#f3f0ed'
  outline: '#7e766c'
  outline-variant: '#cfc5ba'
  surface-tint: '#6a5c47'
  primary: '#6a5c47'
  on-primary: '#ffffff'
  primary-container: '#b5a48b'
  on-primary-container: '#463a27'
  inverse-primary: '#d6c4aa'
  secondary: '#506351'
  on-secondary: '#ffffff'
  secondary-container: '#d0e5ce'
  on-secondary-container: '#556755'
  tertiary: '#5a5e6c'
  on-tertiary: '#ffffff'
  tertiary-container: '#a2a6b6'
  on-tertiary-container: '#373c49'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f3e0c4'
  primary-fixed-dim: '#d6c4aa'
  on-primary-fixed: '#241a09'
  on-primary-fixed-variant: '#514531'
  secondary-fixed: '#d3e8d1'
  secondary-fixed-dim: '#b7ccb6'
  on-secondary-fixed: '#0e1f11'
  on-secondary-fixed-variant: '#394b3a'
  tertiary-fixed: '#dee2f3'
  tertiary-fixed-dim: '#c2c6d6'
  on-tertiary-fixed: '#171b27'
  on-tertiary-fixed-variant: '#424654'
  background: '#fcf9f6'
  on-background: '#1c1c1a'
  surface-variant: '#e5e2df'
  background-main: '#F8F5F2'
  surface-light: '#FFFFFF'
  surface-shadow: '#E6E0D9'
  brass-accent: '#B5A48B'
  sage-accent: '#8FA38E'
  success-soft: '#76937A'
  error-soft: '#C97D7D'
  warning-soft: '#D9A066'
  ocean-slate-bg: '#E2E8F0'
  midnight-ink-bg: '#1A1C1E'
  sunrise-terracotta-bg: '#F9F3EE'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  soft-gap: 32px
---

## Brand & Style
The design system is centered around the "Silk" narrative: a tactile, physical-digital hybrid that evokes the feeling of a premium, embossed paper ledger. The brand persona is **Trustworthy, Clear, and Helpful**, moving away from the flat "SaaS" look toward a more dimensional, "real product" experience.

**Design Movement: Neomorphism (Soft UI)**
The interface utilizes soft, extruded surfaces that appear to emerge from the background. By using dual-light source shadows (top-left highlight, bottom-right shadow), we create a sense of depth without harsh borders. The aesthetic is "quiet luxury"—sophisticated, calm, and highly legible.

## Colors
The default palette, **Brass-Cream**, mimics high-quality stationery. The neutral base (#F8F5F2) is the "canvas." All other colors are applied with restraint to maintain the soft UI effect.

### Color Presets
- **Brass-Cream (Default):** Warm neutrals with metallic brass accents.
- **Ocean-Slate:** Cool grey-blue bases with teal interactive elements.
- **Midnight-Ink:** A deep dark mode utilizing low-contrast charcoal and brass-light highlights.
- **Sage-Paper:** A tranquil green-forward palette for a relaxed financial overview.
- **Sunrise-Terracotta:** Energetic but muted rust tones on a warm cream base.

### Semantic Logic
Colors for Success, Warning, and Error are desaturated to prevent them from "breaking" the soft neomorphic depth. They should appear as tinted indentations or soft glows rather than vibrant flat blocks.

## Typography
**Plus Jakarta Sans** is the sole typeface, chosen for its modern geometric clarity and excellent legibility in financial contexts. 

- **Headlines:** Use a tighter letter spacing and heavier weights to anchor the page.
- **Body:** Generous line-heights are maintained to ensure the "Every rupee in plain sight" philosophy is realized through readability.
- **Labels:** Used for metadata and categories, often rendered in all-caps or slightly tracked out for a "ledger" feel.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous white space (the "Silk" effect). Elements are spaced widely to prevent the neomorphic shadows from overlapping and creating visual mud.

- **Desktop:** 12-column grid with 24px margins.
- **Mobile:** Single column with 16px horizontal safe areas.
- **Spacing Rhythm:** Based on an 8px scale. Significant sections are separated by a "soft-gap" of 32px to emphasize the physical separation of ledger modules.

## Elevation & Depth
Elevation in this design system is not achieved via Z-index stacking, but through **Tonal Extrusion**.

### Extruded State (Buttons, Cards)
Achieved with two shadows:
1. **Light Source:** `-8px -8px 20px` using `#FFFFFF` (white).
2. **Shadow Source:** `8px 8px 20px` using the `surface-shadow` token.

### Recessed State (Input Fields, Active Buttons)
Achieved with two inner shadows:
1. **Top Shadow:** `inset 4px 4px 8px` using `surface-shadow`.
2. **Bottom Highlight:** `inset -4px -4px 8px` using `#FFFFFF`.

Surface colors must match the background exactly to maintain the illusion of being carved from the same material.

## Shapes
In line with the "Soft UI" aesthetic, we use **Round Twelve** (12px/0.75rem for standard elements) to ensure the shadows wrap smoothly around corners. Sharp corners are avoided as they break the liquid, organic feel of the neomorphic effect. 

- **Standard Buttons/Cards:** 12px (`rounded-md`).
- **Containers/Large Sections:** 24px (`rounded-xl`).
- **Interactive Chips:** Pill-shaped.

## Components

### Buttons
Primary buttons use the `brass-accent` with a slight extrusion. On hover, the extrusion depth increases. On click (active), the button switches to a **Recessed State** to simulate a physical press.

### Cards & Surfaces
The primary container for financial data. These should never have borders. The hierarchy is defined entirely by the soft shadow extrusion. Content inside cards should be aligned with generous internal padding (min 24px).

### Input Fields
Inputs are always **Recessed (In-set)**. This creates a clear visual affordance that the area is a "well" to be filled with data. Use `label-sm` for field headers.

### Chips & Tags
Small, pill-shaped elements used for expense categories. They use a very subtle extrusion (half the shadow blur of a card) to remain distinct but secondary.

### Semantic Indicators
For "Profit" (Success) and "Expense" (Error), use soft-colored text with a tiny colored dot indicator, rather than coloring the entire neomorphic container, which can look heavy.
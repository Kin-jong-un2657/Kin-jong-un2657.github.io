# Design contract

## Purpose

Help an OJT recruiter understand Ha Trung Kien's security focus, inspect three concrete projects, download the current CV and contact him. The case-study reader must distinguish verified scope from pending evaluation.

## Direction and tokens

A security research notebook: calm, precise, readable. The signature visual is an illustrative PE file map, grounded in the static-analysis work. It is not actual telemetry or an audited sample.

Core palette: midnight `#0B1424`, raised navy `#121F33`, ice `#7CD4E9`, pale ink `#EDF3FB`, secondary ink `#AAB9CC`, paper `#F5F8FC`. Light mode uses deep ink `#162840` and a darker blue accent `#115D7A` for readable contrast. Semantic tokens define both modes.

Type: self-hosted Manrope variable, one family with deliberate weights. Large name treatment; restrained 16px+ body text and readable case-study columns. No monospace metadata by default.

## Layout exploration and choice

Option A — centered hero and three uniform cards: simple, but obscures the difference between research and implemented backend work. Rejected.

Option B — left-aligned identity and technical illustration, followed by substantial project rows and dedicated reading pages. Selected: a clear recruiter path with enough room for research caveats.

```text
Home:                                  Case study:
HK  Work  About  Contact  Theme          HK  Work  About  Contact  Theme
Name / focus       PE file map           Back to work
Scholarship + CV / contact              Title, role, technology tags
Work introduction + technology filters  Contents     Summary
IAM302t project row                                  Constraints
MiniEcommerce project row                            Architecture
AIC211 project row                                   Decisions
Core competencies + education                       Evaluation
Contact                                             Next project / contact
```

The name is the boldest element. Avoid neon green terminals, glitch motion, fake threat feeds, generic stock portraits, oversized score counters and invented performance graphics. All content is English and derives from `portfolio-content.md`.

## Interaction and responsive rules

- One primary hero action: explore case studies. CV download and contact are clear secondary actions.
- Filter buttons reflect `?tech=` in the URL, announce the result count, preserve browser Back, and do not move keyboard focus.
- Dedicated case-study HTML pages provide deep links and work without JavaScript.
- A theme control follows the saved preference or OS setting, with a guarded localStorage path and reduced-motion support.
- Compact navigation stays available without a menu dependency. No hover-only content. Pointer targets are at least 44px for primary controls.
- Single-column mobile, two-column hero/competency layout on wider screens. Verify 320, 375, 768, 1024 and 1440px, landscape and text zoom.
- Pending measurements become textual badges. Do not expose raw editorial placeholders, internal evidence links or private source snapshots.

## Skill calibration

The ui-ux-pro-max design-system searches returned cyberpunk and OLED/testimonial directions that did not fit the requested balanced light/dark portfolio. They were not persisted as a verified design recommendation. This contract uses the skill's accessibility, contrast and responsive priorities; the targeted HTML/Tailwind search verified focus-visible and navigation layering guidance. No testimonials or live metrics are introduced.

Verification: local static build, internal-link and publishing-boundary checks, Chromium console/network checks, keyboard interaction, both themes, responsive screenshots and axe-core checks. Publishing requires a separate, explicit deployment request.

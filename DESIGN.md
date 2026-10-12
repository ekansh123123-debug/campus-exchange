---
version: 1.0
name: CampusExchange-Scholarly-Design-System
source_skills:
  - .agent/skills/awesome-design-md/design-md/claude/DESIGN.md
  - .agent/skills/awesome-design-md/design-md/cal/DESIGN.md
  - .agent/skills/awesome-design-md/design-md/mintlify/DESIGN.md
description: >
  A warm-canvas academic & editorial interface tailored for CampusExchange — a verified engineering student
  marketplace and PYQ/study-resource library. Anchored on a warm parchment cream canvas (#faf9f5) with
  scholarly serif headlines, crisp 1px architectural hairlines (#e6dfd8), terracotta primary CTAs (#cc785c),
  and high-contrast accessible status badges that always pair icons with explicit labels (never color alone).
---

# CampusExchange Design System (`DESIGN.md`)

## 1. Visual Philosophy

1. **Calm Academic Trust over Cluttered Classifieds**: Engineering students searching for textbooks, lab kits, calculators, and previous-year question papers (PYQs) need high signal-to-noise clarity. Surfaces use warm paper tones (`#faf9f5` canvas, `#f5f0e8` secondary surface, `#ffffff` elevated cards) that reduce eye strain.
2. **Explicit State Visibility (Never Color Alone)**: Every listing (`Pending Approval`, `Active`, `Reserved`, `Sold`, `Rejected`, `Removed`), transaction (`Reserved`, `Pending Exchange`, `Accepted`, `Completed`, `Cancelled`, `Expired`), and resource (`Pending`, `Approved`, `Rejected`, `Removed`) displays both a semantic icon and a human-readable label pill.
3. **Cryptographic Public Codes in Monospace**: Public identifiers (`CEU-*`, `CEL-*`, `CET-*`, `CER-*`, `CERPT-*`, `CEC-*`) are rendered in `JetBrains Mono` / `ui-monospace` pills for effortless verification during campus meet-up handovers.
4. **Permission-Aware Controls**: Action buttons only appear when permitted by the actor's verification status, role, ownership, and the entity's current state machine.

## 2. Color Tokens

| Token | Hex | Role |
|---|---|---|
| `--ce-canvas` | `#faf9f5` | Primary page background (warm editorial parchment) |
| `--ce-surface-soft` | `#f5f0e8` | Secondary section / filter sidebar / table header background |
| `--ce-surface-card` | `#ffffff` | Interactive card surface |
| `--ce-surface-muted` | `#efe9de` | Subtle chip / code pill surface |
| `--ce-surface-dark` | `#181715` | Deep academic ink band / dark callout surface |
| `--ce-ink` | `#141413` | Primary heading and key value text |
| `--ce-body` | `#3d3d3a` | Standard body copy |
| `--ce-muted` | `#6c6a64` | Secondary metadata and helper text |
| `--ce-hairline` | `#e6dfd8` | Crisp 1px card and layout border |
| `--ce-primary` | `#cc785c` | Primary terracotta brand CTA |
| `--ce-primary-hover` | `#a9583e` | Primary CTA hover/active state |
| `--ce-accent-teal` | `#1ba673` | Verified badge / approved active state |
| `--ce-accent-blue` | `#2563eb` | Exchange & academic branch tag |
| `--ce-warning` | `#b45309` | Pending moderation / reserved timer alert |
| `--ce-danger` | `#c64545` | Rejection / block / destructive confirmation |

## 3. Typography

- **Display & Page Headings (`--font-serif`)**: `'Newsreader', 'Georgia', 'Times New Roman', serif` — warm editorial authority for hero titles and section headers.
- **UI & Body Prose (`--font-sans`)**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — clean geometric legibility for filters, forms, cards, and chat.
- **Public Codes & Metadata (`--font-mono`)**: `'JetBrains Mono', 'Fira Code', ui-monospace, monospace` — used for `CEL-xxxx`, `CET-xxxx`, `CER-xxxx`, prices, and timestamps.

# 龜馬山整合服務平台 - Design Guidelines

## Design Approach

**Selected Approach**: Hybrid System (Material Design foundation + LINE-inspired elements)

**Justification**: As a service platform integrated with LINE LIFF, the design must balance professional functionality with mobile-friendly accessibility. Material Design provides robust patterns for information density while LINE's influence ensures familiarity for Taiwanese users.

**Key Principles**:
- Mobile-first responsive design (LINE LIFF primary use case)
- Clear information hierarchy for service navigation
- Trust-building through clean, professional aesthetics
- Accessible color contrast for all age groups

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 150 65% 45% (Green - representing mountain/nature theme)
- Primary Hover: 150 65% 38%
- Background: 0 0% 100%
- Surface: 150 20% 97%
- Text Primary: 0 0% 13%
- Text Secondary: 0 0% 45%
- Border: 150 15% 88%

**Dark Mode**:
- Primary: 150 60% 55%
- Primary Hover: 150 60% 62%
- Background: 0 0% 9%
- Surface: 150 8% 14%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 65%
- Border: 150 10% 22%

**Accent** (use sparingly for CTAs): 200 85% 55%

### B. Typography

**Font Families**:
- Primary: 'Noto Sans TC' (Google Fonts) - optimized for Traditional Chinese
- Headings: 'Noto Sans TC', weights 600-700
- Body: 'Noto Sans TC', weight 400
- UI Elements: 'Noto Sans TC', weight 500

**Scale**:
- H1: text-4xl (36px) / font-bold / leading-tight
- H2: text-3xl (30px) / font-semibold / leading-snug
- H3: text-2xl (24px) / font-semibold / leading-normal
- H4: text-xl (20px) / font-medium / leading-normal
- Body: text-base (16px) / font-normal / leading-relaxed
- Small: text-sm (14px) / font-normal / leading-normal
- Tiny: text-xs (12px) / font-normal / leading-normal

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Micro spacing: p-2, gap-2 (8px)
- Standard spacing: p-4, m-4, gap-4 (16px)
- Section spacing: py-8, py-12 (32px-48px mobile), py-16, py-20 (64px-80px desktop)
- Large gutters: mt-16, mb-20 (64px-80px)

**Grid Structure**:
- Mobile: Single column, max-w-full with px-4
- Tablet: max-w-4xl, 2-column grids for cards
- Desktop: max-w-6xl, 3-4 column grids for service cards

**Container Strategy**:
- Full-width hero/header: w-full
- Content sections: max-w-6xl mx-auto px-4
- Form containers: max-w-2xl

### D. Component Library

**Navigation**:
- Mobile: Bottom tab bar (LINE-style) with 4-5 primary services
- Desktop: Top horizontal navigation with logo left, services center, user right
- Sticky header with subtle shadow on scroll
- Icons from Heroicons (outline style)

**Cards (Service Modules)**:
- Rounded-xl borders (12px radius)
- Surface background with subtle border
- Hover: slight scale (1.02) and shadow elevation
- Padding: p-6 on desktop, p-4 on mobile
- Icon + Title + Description + Arrow/CTA layout

**Buttons**:
- Primary: Filled with primary color, rounded-lg, px-6 py-3
- Secondary: Outline with primary border, bg-transparent
- Text: No border, primary text color
- Icon buttons: Circular, 40px × 40px tap target

**Forms**:
- Input fields: rounded-lg, border-2, focus ring in primary color
- Labels: text-sm, font-medium, mb-2
- Error states: red-500 text and border
- Helper text: text-xs, text-secondary

**Data Display**:
- Tables: Striped rows, hover highlight, rounded corners
- Lists: Dividers between items, left-aligned with icons
- Stats: Large numbers (text-3xl), small labels below

**Modals/Overlays**:
- Backdrop: bg-black/50
- Modal: max-w-lg, rounded-2xl, p-6
- Slide-up sheets for mobile (LINE-style)

### E. Page Layouts

**Landing/Home Page**:
- Hero: Full-width with mountain imagery (80vh), gradient overlay (150 degrees, from primary/20 to transparent), centered content with headline + subtitle + primary CTA
- Services Grid: 3-column on desktop, 2-column tablet, 1-column mobile
- Quick Access: 4-icon grid for most-used functions
- Announcements: Scrollable card carousel
- Footer: Multi-column (About, Services, Contact, Legal)

**Service Detail Pages**:
- Breadcrumb navigation
- Page title + description section
- Content in max-w-3xl for readability
- Sidebar (desktop) with related services
- Fixed bottom CTA bar (mobile)

**Dashboard/User Area**:
- Stats overview cards (grid-cols-2 lg:grid-cols-4)
- Activity feed with timeline design
- Quick actions toolbar
- Profile card with avatar

## Images

**Hero Image**: Full-width mountain landscape of Guimashan area, slightly desaturated to not compete with text. Apply dark gradient overlay (from bottom: black/60 to transparent at 40% height).

**Service Icons**: Use Heroicons throughout for consistency - no custom illustrations needed.

**Profile/Avatar Placeholders**: Circular, 48px standard size, with fallback initials on colored background.

**Background Patterns**: Subtle topographic line patterns (opacity 5%) on section backgrounds for thematic consistency.

## Key UX Patterns

**Mobile-First Gestures**:
- Swipe for carousels/tabs
- Pull-to-refresh on data lists
- Bottom sheet modals

**Loading States**:
- Skeleton screens matching content layout
- Shimmer animation (primary color at 10% opacity)

**Feedback**:
- Toast notifications (top-right desktop, top-center mobile)
- Success: green accent, Error: red, Info: blue
- 3-second auto-dismiss with close button

**Empty States**:
- Centered icon + message + optional CTA
- Friendly, encouraging copy in Chinese

This design creates a trustworthy, accessible platform that feels native to LINE users while maintaining professional service platform standards.
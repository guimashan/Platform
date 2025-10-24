# 龜馬山整合服務平台 Design Guidelines

## Design Approach

**Selected Approach:** Cultural-Specific Hybrid (Taiwan Temple Aesthetic + Mobile App Utility)

Drawing inspiration from modern Taiwanese spiritual/cultural apps while maintaining traditional temple dignity. This combines the clean efficiency of LINE's mobile interface patterns with the reverent atmosphere of temple environments.

**Design Principles:**
- Respect and reverence through visual hierarchy
- Immediate clarity for all age groups
- Mobile-optimized touch targets and spacing
- Cultural authenticity balanced with modern usability

---

## Typography

**Primary Font Family:** 
- Noto Sans TC (Traditional Chinese) via Google Fonts
- Supports full range of Traditional Chinese characters
- Excellent readability on mobile screens

**Type Scale:**
- **Hero/Headers:** 32px (2rem), Bold (700)
- **Section Titles:** 24px (1.5rem), Bold (700)  
- **Body Text:** 16px (1rem), Regular (400)
- **Secondary/Meta:** 14px (0.875rem), Regular (400)
- **Small/Labels:** 12px (0.75rem), Medium (500)

**Line Height:** 1.6 for Chinese text (improved vertical rhythm)

---

## Layout System

**Spacing Primitives:** Tailwind units of **4, 6, 8, 12, 16**
- Micro spacing: `p-4`, `gap-4`
- Component spacing: `p-6`, `m-8`
- Section spacing: `py-12`, `py-16`

**Mobile Container:**
- Full-width sections with `px-4` horizontal padding
- Maximum content width: `max-w-md` (448px) for optimal mobile readability
- No complex multi-column layouts (mobile-first)

**Vertical Rhythm:**
- Consistent `py-6` between major sections
- `gap-4` for related elements
- `gap-8` between distinct component groups

---

## Component Library

### Header/Navigation
- Fixed top header with subtle shadow
- Height: 64px (h-16)
- Logo/Title centered
- Menu icon (hamburger) positioned top-right
- User avatar/name top-left
- Includes subtle divider line

### QR Scanner Interface (Primary Action)
- Large, prominent QR scan button (central focus)
- Size: 80px × 80px minimum touch target
- Icon: QR code symbol from Heroicons
- Accompanied by clear instructional text
- Positioned in upper third of viewport for thumb accessibility

### Check-in Card
- Rounded corners (`rounded-2xl`)
- Padding: `p-6`
- Shadow: subtle elevation (`shadow-lg`)
- Contains:
  - Temple/Event name (bold, 18px)
  - Date/Time stamp (14px)
  - Location badge
  - Status indicator (completed/pending)
  - Divider between information sections

### History List
- Chronological reverse order (newest first)
- Each entry as a card with `mb-4` spacing
- Grouped by month with sticky headers
- Infinite scroll or pagination (show 20 per load)
- Empty state illustration for new users

### Stats Dashboard
- Three-column grid on mobile (`grid-cols-3 gap-4`)
- Each stat card:
  - Large number (28px, bold)
  - Label beneath (12px)
  - Icon above number
  - Equal height cards (`h-24`)

### Bottom Navigation
- Fixed bottom bar: 72px height
- Three primary actions:
  - Home (house icon)
  - Scan QR (QR icon, emphasized)
  - History (clock icon)
- Active state: underline or indicator dot
- Icons from Heroicons (outline style)

### Confirmation Modal
- Centered overlay with backdrop blur
- Rounded corners (`rounded-3xl`)
- Padding: `p-8`
- Success/Error icon (56px)
- Message text (16px, centered)
- Primary action button
- Auto-dismiss after 2 seconds or user tap

### Forms/Input (if needed for profile)
- Full-width inputs
- Height: 48px (touch-optimized)
- Border radius: `rounded-lg`
- Clear label above input (14px)
- Focus state with border treatment
- Validation messages below (12px)

---

## Images

### Hero/Welcome Screen
**Placement:** Initial app load/home screen background

**Description:** Atmospheric photograph of traditional Taiwanese temple interior - focus on ornate ceiling details, lanterns, or incense smoke. Image should be slightly desaturated and overlaid with gradient to maintain text readability. Use as full-screen background (100vh) on first visit only.

**Treatment:** 
- Subtle gradient overlay from bottom
- Slight blur effect for depth
- Vignette edges
- Text/buttons float centered with frosted glass background (`backdrop-blur-md`)

### Profile/Achievement Badges
**Placement:** User profile section, achievement showcase

**Description:** Iconographic representations of temple elements (lotus flowers, incense, lanterns) rendered in line-art style for milestones and achievements. These are supplementary decorative elements, not primary imagery.

### Empty States
**Placement:** History list when no check-ins exist

**Description:** Simple, friendly illustration of temple elements or QR scanning action. Line-art style, single-color treatment to match overall aesthetic. Centered with explanatory text below.

---

## Key Interactions

- **Pull-to-refresh** on history list
- **Haptic feedback** on successful check-in (vibration)
- **Smooth scroll** between sections
- **Slide-up modal** for check-in confirmation
- **Swipe gestures** for navigation (iOS standard patterns)

---

## Accessibility

- Minimum touch targets: 44px × 44px
- High contrast text ratios (maintained throughout)
- Clear focus indicators for all interactive elements
- Support for larger text sizes (system font scaling)
- Semantic HTML structure for screen readers
- Alternative text for all images and icons

---

**Icon Library:** Heroicons (outline style) via CDN for consistency with LINE's modern aesthetic
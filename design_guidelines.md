# Design Guidelines: Transportation Quote SaaS

## Design Approach
**System-Based with Modern SaaS References**
Primary inspiration from Linear's clean admin interfaces and [REDACTED-STRIPE] data-focused dashboards. This is a utility-first business tool prioritizing efficiency, clarity, and professional presentation.

**Core Principles:**
- Data clarity over decoration
- Efficient workflows with minimal clicks
- Professional credibility for B2B context
- Clear visual hierarchy for complex pricing data

---

## Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for numerical data, distances, pricing)

**Hierarchy:**
- Page Headers: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels: text-sm font-medium
- Help Text: text-sm font-normal
- Data/Numbers: text-base font-mono

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4
- Form field spacing: space-y-4

**Grid Structure:**
- Max container width: max-w-7xl
- Dashboard: 2-column on desktop (sidebar + main), stack on mobile
- Admin tables: Full-width with horizontal scroll on mobile
- Forms: Single column max-w-2xl centered

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with logo left, user menu right
- Height: h-16
- Navigation links centered (Dashboard, New Quote, History, Admin)
- User avatar with dropdown (Profile, Settings, Logout)

**Admin Sidebar (Admin Panel Only):**
- Fixed left sidebar w-64
- Sections: Pricing Rules, Vehicle Types, Zones, Users
- Active state indicators for current section

### Authentication
**Login Page:**
- Centered card max-w-md with Replit Auth integration
- Company logo at top
- "Transportation Quote System" heading
- Social login buttons (Google, GitHub)
- Clean, professional presentation

### Dashboard Layout
**Quote Calculator (Main Feature):**
- Prominent card with clear steps
- Two-column address inputs (Origin | Destination)
- Vehicle type selector (dropdown or radio cards)
- "Calculate Quote" primary button
- Live distance display using OpenRouteService
- Quote breakdown card showing: Distance, Base Rate, Per KM, Zone Fees, Total (large, emphasized)

**Quote History Table:**
- Sortable columns: Date, Route, Distance, Vehicle, Total
- Action buttons: View Details, Duplicate
- Pagination for large datasets
- Search/filter controls

### Admin Panel Components
**Pricing Rules Manager:**
- Table layout with inline editing
- Columns: Rule Name, Vehicle Type, Base Fee, Per KM Rate, Active Status
- Add/Edit modal forms
- Delete confirmation dialogs

**Data Tables Standard:**
- [REDACTED-STRIPE] rows for readability
- Hover states on rows
- Action column (right-aligned icons)
- Empty states with helpful CTAs

### Forms
**Input Fields:**
- Consistent height: h-10 or h-12
- Clear labels above inputs
- Placeholder text for guidance
- Address autocomplete integration ready
- Number inputs with step controls for pricing

**Buttons:**
- Primary: Solid with clear hierarchy
- Secondary: Outline style
- Danger: For destructive actions (delete)
- Sizes: Default (px-4 py-2), Large (px-6 py-3)

### Cards & Containers
**Dashboard Cards:**
- Rounded corners (rounded-lg)
- Subtle borders
- Padding: p-6
- Shadow: shadow-sm with hover:shadow-md transition

**Stat Cards (Dashboard Overview):**
- 3-column grid: Total Quotes, Revenue, Active Routes
- Large numbers in monospace font
- Small trend indicators

---

## Images

**Hero Section (Login/Landing):**
Large hero image depicting professional transportation (trucks on highway, logistics warehouse, or fleet vehicles). Image should convey reliability and professionalism. Height: 60vh on desktop, 40vh on mobile.

**Dashboard Icons:**
Use Heroicons (via CDN) throughout:
- Navigation: Map, Calculator, Clock, Settings, Users
- Actions: Plus, Pencil, Trash, Check, X
- Status: CheckCircle, ExclamationCircle

**Empty States:**
Simple iconography with concise messaging for:
- No quotes yet → "Create your first quote"
- No pricing rules → "Add pricing rules to start"

---

## Responsive Behavior

**Mobile (< 768px):**
- Stack all multi-column layouts
- Collapsible sidebar (hamburger menu)
- Full-width tables with horizontal scroll
- Larger touch targets (min h-12)

**Desktop (≥ 1024px):**
- Fixed sidebar navigation
- Multi-column dashboard layouts
- Expanded data tables
- Side-by-side form layouts where appropriate

---

## Key Interactions

- Form validation with inline error messages
- Loading states during API calls (distance calculation, quote generation)
- Success confirmations for CRUD operations
- Smooth transitions between calculator steps
- Auto-save drafts for partial quotes

**Critical:** Maintain professional, business-tool aesthetic throughout. Prioritize data clarity and workflow efficiency over decorative elements.
# CLAUDE.md — Jade Compass Project Spec

## Brand
Jade Compass — premium business intelligence for small business owners.
Positioning: "Strategic Intelligence for Business Decision-Makers"
No mention of "AI" on client-facing pages. Describe as "systematic research methodology" or "proprietary analytical framework."

## Design System
- **Colors:** Primary #0B6E4F (deep jade), Accent #C9A84C (gold), Background #0D0D1A (dark), Surface #1A1A2E, Text #FFFFFF
- **Typography:** Inter (headings, using next/font/google), Merriweather (body serif for gravitas)
- **Style:** Minimalist, high-end consultancy feel. Dark theme. Subtle animations with Framer Motion.

## Pages (Single-page app with sections)

### Page: `/` (landing page)
Sections in order:
1. **Navbar** - Logo "Jade Compass" + nav links + CTA button
2. **Hero** - Bold headline, subtitle, animated background (subtle particles/dots), CTA
3. **How It Works** - 3-step process with icons, staggered animation
4. **Services/Pricing** - 3 cards: Scan $97, Briefing $197/mo, Deep Dive $497
5. **About** - Brand story paragraph
6. **FAQ** - Collapsible FAQ items
7. **CTA Footer** - Final call to action
8. **Footer** - Links, copyright

### Page: `/questionnaire`
Form with fields: business name, industry, years in operation, revenue range, main competitors, challenges, target customers, what they want to know. Beautiful dark-themed form.

### Page: `/admin`
Simple login page + dashboard showing orders list, ability to view questionnaire answers. This is for the business owner to manage orders.

### Page: `/thank-you`
After payment, show thank you + link to questionnaire.

## Tech Stack
- Next.js 16.2.6 App Router
- Tailwind CSS v4
- Framer Motion
- No database for MVP — use JSON files in /data/ for storage (simple, portable)
- PayPal JS SDK for payments (PayPalButtons component)
- next/font/google for Inter + Merriweather

## File Structure to Create
```
src/
  app/
    layout.tsx          - Root layout with fonts, metadata, dark theme
    page.tsx            - Landing page (all sections)
    globals.css         - Tailwind import + custom styles
    questionnaire/
      page.tsx          - Questionnaire form
    admin/
      page.tsx          - Login/admin dashboard
    thankyou/
      page.tsx          - Thank you page after payment
    api/
      paypal/
        create-order/route.ts
        capture-order/route.ts
      questionnaire/
        submit/route.ts
      admin/
        orders/route.ts
  components/
    Navbar.tsx
    HeroSection.tsx
    HowItWorksSection.tsx
    PricingSection.tsx
    AboutSection.tsx
    FAQSection.tsx
    CTASection.tsx
    Footer.tsx
    AdminLogin.tsx
    AdminDashboard.tsx
    QuestionnaireForm.tsx
data/                   - JSON storage directory
```

## Key Rules
1. Use 'use client' only for components needing interactivity (buttons, forms, PayPal)
2. Components without client interactivity stay as Server Components (default)
3. Tailwind v4 uses `@import "tailwindcss"` in globals.css (not @tailwind directives)
4. Proxy = middleware in Next.js 16 (use proxy.ts, not middleware.ts)
5. Fonts: Google Fonts via next/font/google
6. Metadata via `export const metadata` in layout.tsx
7. All client-facing copy is in English
8. Responsive: mobile-first design
9. Animations: use Framer Motion's fadeInUp pattern, staggerChildren
10. No AI terminology on client-facing pages

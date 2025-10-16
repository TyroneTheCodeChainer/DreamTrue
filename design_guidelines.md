# DreamLens Mobile PWA - Design Guidelines

## Design Approach
**System-Based Approach**: Using Material Design 3 principles adapted for mobile-first dream journaling experience, with custom theming for the mystical/sleep domain. The app prioritizes accessibility, touch interactions, and offline functionality while maintaining scientific credibility.

## Core Design Elements

### A. Color Palette

**Primary Colors (Dark & Light Mode)**
- Primary Purple: 259 54% 72% (Base gradient start #667eea)
- Secondary Purple: 272 44% 57% (Base gradient end #764ba2)
- Deep Night: 259 60% 15% (Dark backgrounds)
- Light Dream: 259 40% 98% (Light backgrounds)

**Functional Colors**
- Success (High Confidence): 142 71% 45% (Green for 80%+ scores)
- Warning (Medium): 38 92% 50% (Amber for 50-79%)
- Error (Low): 0 72% 51% (Red for <50%)
- Info: 217 91% 60% (Blue for insights)

**Surface Colors**
- Dark Mode Surface: 259 30% 12%
- Dark Mode Elevated: 259 25% 18%
- Light Mode Surface: 0 0% 100%
- Light Mode Elevated: 259 20% 96%

### B. Typography

**Font Stack**: 
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Monospace (for IDs/timestamps): 'JetBrains Mono', 'Courier New', monospace

**Type Scale**
- Display (Dream titles on detail): text-4xl font-bold (36px)
- Headline (Page headers): text-2xl font-semibold (24px)
- Body Large (Interpretations): text-base leading-relaxed (16px/1.75)
- Body (General content): text-sm (14px)
- Caption (Metadata, timestamps): text-xs text-muted (12px)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 4, 8, 12, 16, 20, 24, 32
- Card padding: p-4 md:p-6
- Section spacing: space-y-4 md:space-y-6
- Container max-width: max-w-7xl (for desktop fallback)
- Mobile container: max-w-full px-4

**Grid System**
- Mobile (default): Single column, full-width cards
- Tablet (md:): 2 columns for dream cards, single for details
- Desktop (lg:): Retain mobile-first layout with wider cards, not multi-column

### D. Component Library

**Navigation**
- Bottom Tab Bar (Mobile): Fixed bottom navigation with 4 tabs (Home, Dreams, Patterns, Settings)
- Top App Bar: Page title, back button (when nested), action icons
- Floating Action Button (FAB): Large purple gradient circle for "New Dream" on home and dreams list

**Cards**
- Dream Entry Card: Rounded-2xl, shadow-lg, gradient border-l-4 (confidence color)
- Detail Card: Rounded-xl, elevated surface, collapsible sections
- Stat Card: Small rounded-lg with icon, number, label (gradient background for key metrics)

**Forms**
- Dream Input: Large textarea with auto-resize, voice input button (mic icon)
- Context Chips: Selectable chips for stress level, emotions (pill-shaped, toggle selection)
- System Toggle: Segmented control for RAG vs Agentic (iOS-style)

**Data Display**
- Confidence Meter: Circular progress ring with percentage in center
- Source Badges: Small rounded pills with research icons
- Timeline: Vertical connected list for dream history
- Charts: Touch-enabled donut and line charts with swipe navigation

**Overlays**
- Analysis Loading: Full-screen overlay with animated moon phases progress
- Voice Recording: Bottom sheet with waveform visualization
- Offline Banner: Top toast notification with sync status

### E. Interactions & Animations

**Gestures**
- Swipe Left/Right: Navigate between dreams in detail view
- Pull to Refresh: Sync dreams in list view
- Long Press: Quick actions menu on dream cards (delete, share)
- Pinch to Zoom: Enlarge interpretation text in detail view

**Micro-animations**
- Card Tap: Scale down to 0.98 + shadow reduction (150ms ease-out)
- FAB: Ripple effect + rotate mic icon when recording
- Confidence Score: Animated counter from 0 to final percentage
- Page Transitions: Slide-in from right for drill-down, fade for tab switches
- Loading: Pulsing moon icon with rotating stars (cosmic theme)

**No Gratuitous Animation**: Respect prefers-reduced-motion, use spring physics (0.5s with bounce) only for critical feedback

## Key Features

### Progressive Web App Elements
- Install Prompt: Custom banner after 2 dream entries (gradient background, app icon)
- Splash Screen: Purple gradient with white DreamLens logo and moon icon
- Offline Mode: Gray-tinted UI with "Recording Locally" badge, auto-sync when online
- App Icon: Rounded square with gradient background, white crescent moon, "DL" text

### Mobile-Specific Enhancements
- Voice Input Widget: Bottom sheet with live transcription, pause/resume, language selector
- Quick Context: Floating chips for recent stress/emotion states (1-tap reuse)
- Dream Streak: Calendar heat map showing recording consistency
- Share Dreams: Native share sheet for exporting interpretations (text/image)

### Accessibility
- Minimum Touch Target: 44x44px for all interactive elements
- Contrast Ratios: WCAG AAA for body text (7:1), AA for large text (4.5:1)
- Focus Indicators: 3px solid ring with 2px offset (high contrast mode aware)
- Screen Reader: Semantic HTML, ARIA labels for all icons, live regions for analysis updates
- Dark Mode: Automatic system sync with manual override toggle

## Images

**Hero Section (Home Page)**
- Large Hero Image: Ethereal night sky with stars, subtle purple gradient overlay
- Position: Above fold, 60vh height, rounded bottom corners
- Content Over Image: "Understand Your Dreams" headline (white text-shadow), subtitle, CTA button with blurred background
- Alternative: Animated SVG illustration of sleeping person with floating dream symbols (lighter weight)

**Empty States**
- No Dreams Yet: Illustrated sleeping moon character with stars
- No Patterns: Abstract constellation connecting dots (representing pattern discovery)
- Offline: Simple cloud icon with crossed wifi symbol

**Analysis Visualization**
- Symbol Icons: Custom line-art icons for common symbols (teeth, flying, water, chase)
- Confidence Visualization: Animated circular progress with gradient stroke
- Research Sources: Book/paper icons next to each citation

## Page-Specific Layouts

### Home (Dream Input)
- Hero with welcoming imagery and tagline
- Large voice-enabled textarea (rounded-2xl, gradient focus ring)
- Quick context chips below textarea
- System selector (RAG/Agentic) as segmented control
- Primary CTA: Large gradient button "Analyze Dream"
- Recent Dreams: Horizontal scrollable cards (2.5 visible, snap scroll)

### Dreams List
- Floating Search Bar: Sticky at top with filter chips below
- Masonry Grid: Cards of varying heights based on content length
- Infinite Scroll: Load more with loading skeleton
- Empty State: Centered illustration with onboarding CTA

### Dream Detail
- Full-screen modal on mobile with slide-up animation
- Header: Dream preview with confidence ring, share icon
- Tabbed Sections: Interpretation, Symbols, Sources, Alternative (swipeable)
- Sticky CTA Bar: "Re-analyze" or "Similar Dreams" buttons

### Patterns/Analytics
- Top Stats: 4 stat cards in 2x2 grid (total dreams, avg confidence, streak, symbols)
- Interactive Charts: Full-width donut chart (top symbols), line chart (dreams over time)
- Insights Cards: Swipeable carousel of AI-generated insights
- Heat Map: Monthly calendar showing dream recording frequency

## Technical Considerations
- Install as PWA: Service worker caches all templates, CSS, JS for offline use
- Local Storage: Draft dreams, offline queue, user preferences
- IndexedDB: Full dream history for offline access
- Background Sync: Auto-upload when connection restored
- Responsive Images: Use srcset for hero images (WebP with JPEG fallback)

## Brand Voice in UI
- Supportive & Scientific: "Your dreams analyzed with research-backed insights"
- Non-judgmental: "Every dream is valid" messaging
- Empowering: "Unlock your subconscious" rather than "We decode your dreams"
- Transparent: Always show confidence scores and research sources
# Client design corrections — 323532.mp4

Reference: 38.66-second 720×1600 phone recording. Original dashboard/menu approximately 0–15 seconds, original cricket market 16–23 seconds, existing implementation 24–38 seconds. Dimensions below are approximate CSS-pixel equivalents at 405px wide; recording alone cannot establish exact source CSS or easing.

- Header: 77–79px mobile band, Dashboard beside hamburger/outlined drawer close button, account balance above username; scrolling notice remains between brand and account.
- Summary: inset navy Credit / Balance / Liable / Active Bets strip, 5px outer inset, approximately 39px minimum height; wraps safely for large numbers.
- Drawer: approximately 41.4% viewport width, same Dashboard baseline, 106px top area, 43px menu rows, transparent backdrop, sliding transition, rotating casino icons and pulsing TeenPatti/Galaxy backgrounds. Escape and Dashboard close the drawer. Reduced-motion is respected.
- Dashboard: three banner tiles, 12px gutters, equal 48px racing rows, 78px category tiles and compact gray sport headings.
- Cricket market: shared condensed font/header, no dashboard account strip on this route, navy match card, green category tabs, separate light-blue/pink odds cells, gray suspended state, full-width TV/Score Card tabs and compact open/matched bet headings.
- Removed accumulated conflicting client overrides from index.css; client-reference.css is the single client layout stylesheet. Existing desktop table geometry retained.
- Existing casino banner images and Latin Roboto Condensed 400/700 are served locally. Font license included.

Validation: production build and TypeScript check pass. Local browser screenshots inspected at 405px for dashboard, open sidebar, cricket market using isolated mock read responses, not production accounts. No page exceptions observed. Market viewport overflow checked at 360, 390, 405, 412, 768 and 1440px. This is visual verification, not production authentication or wager/settlement validation. Different match/account data in the recording was not copied. Exact animation timings and unseen states remain approximate.

# DeskGuard Pitch Slides Outline

Copy-paste this outline slide-by-slide into **PowerPoint** or **Google Slides**:

---

## Slide 1: Welcome & Overview
*   **Title**: DeskGuard — Library Seating occupancy system
*   **Subtitle**: Smart seat management and anti-hoarding portal
*   **Key Points**:
    *   **The Problem**: Students occupy desks with bags/belongings and go away for hours (seating hoarding).
    *   **The Fix**: Smart phone scanning check-ins, live color-coded occupancy maps, and server-side inactivity sweeper timers.
    *   **Result**: Optimizes student seat access, reduces conflicts, and streamlines space allocation.

---

## Slide 2: Core Features
*   **Title**: Frictionless Desk Booking Flows
*   **Key Points**:
    *   **QR Check-In**: Students scan desk QR codes to automatically check in and hold a desk.
    *   **Coffee Break Mode**: "Away" button pauses sessions for up to 20 minutes before automatically releasing the desk.
    *   **Librarian Overrides**: Chief librarian dashboard displays alerts for expired sessions with options to manually "Force Reset" occupied desks.

---

## Slide 3: System Architecture
*   **Title**: Modern Technical Stack
*   **Key Points**:
    *   **Frontend**: React client built with Vite, featuring custom interactive SVG seat maps and Zinc dark themes.
    *   **Real-time synchronization**: Server-Sent Events (SSE) connections broadcast desk updates to all active browsers instantly.
    *   **Security**: Dedicated registration and login screens backed by JWT token authorization headers and `bcryptjs` password hashing.
    *   **Storage**: Connects to cloud Supabase PostgreSQL databases with a local JSON filesystem database fallback for development.

---

## Slide 4: Operations & Print Layouts
*   **Title**: Physical Label Sheets Print System
*   **Key Points**:
    *   **Print Stylesheet**: Custom `@media print` CSS formats printable desk cards automatically (hiding navigation buttons and summaries).
    *   **Label Sheets**: Clean 2-column sticker card grid formatted to fit standard A4 label printing sheets.
    *   **Automatic QR server**: On-the-fly QR code images directing students to their desk check-in links.
    *   **Hosting**: Static assets hosted on Vercel, with persistent API services hosted on Render.

---

## Slide 5: Value Proposition
*   **Title**: Why DeskGuard Matters
*   **Key Points**:
    *   **Fair Study Environments**: Ensures desks remain available to active students.
    *   **Administrative Oversight**: Equips library staff with live status streams.
    *   **Data Analytics Potential**: Tracks booking logs to reveal peak hours and popular study zones.
    *   **Productivity Optimization**: Expected study room seating availability optimization by up to 90%.

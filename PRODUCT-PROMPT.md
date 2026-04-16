# Product Injection Prompt

This is the prompt that helped me build the initial application.

## Proton Shortcut Wrapper
- Build a keyboard-first wrapper over ProtonMail that remaps Proton behavior to Gmail-style shortcuts
- Target users are people switching from Gmail who feel slowed down by Proton’s native shortcut model
- Core value is muscle-memory preservation: J/K/X/Shift+#/Shift+I/Shift+U/L should behave like Gmail
- Biggest UX pain to solve is focus loss after leaving a message, so shortcuts keep working without extra clicking

## Mission

I want to build a keyboard-first browser-based email control layer that helps people switching from Gmail to ProtonMail keep their existing shortcut muscle memory and move through inbox workflows without friction. It should feel fast, invisible, familiar, and quietly empowering and express control, forgiveness, focus, and calm precision.

## Project Name

ProtonFlow

## Target Audience
- Gmail power users migrating to ProtonMail
- Founders, operators, and technical professionals who process email heavily with keyboard shortcuts
- Privacy-conscious users who want ProtonMail without sacrificing Gmail-grade speed
- Core features and pages

## Homepage
- Explain the value in one sentence: “Use ProtonMail like Gmail.”
- Primary CTA should feel immediate and confident: install script / enable wrapper / view shortcut map
- Layout should be simple and highly legible, with a strong first impression of speed and trust
- Remap Gmail-style shortcuts onto ProtonMail behavior

## Core Supported Actions:
- J moves cursor down
- K moves cursor up
- X selects thread
- Shift + 3 trashes and marks unread (proton functionality seems to mark it read if you move to trash)
- Shift + I marks read
- Shift + U marks unread
- E to archive and mark unread
- L opens label UI, enter to select the label, enter to apply, esc to exit
- Support scope-aware handling so shortcuts behave correctly in inbox, thread, and selection states
- Wrapper should intercept keyboard input only where appropriate and avoid conflicting with text-entry fields

## Focus Persistence Engine
- Solve ProtonMail’s biggest usability issue: after returning from a message, users should not need to click back into the UI to resume shortcuts
- Restore keyboard focus automatically after thread close, inbox return, navigation changes, and view transitions
- Make this feel invisible and reliable, not hacky or aggressive

## Settings / Customization
- Toggle Gmail-compatible mode on/off
- Let users customize bindings for edge cases
- Add options for delay timing, focus restoration behavior, and overlay visibility
- Currently the context in the repository uses a simple .js script with violentmonkey to apply it. Please look into other methods of packacking this (perhaps Google Chrome Extension?)

## Compatibility / Health Status
- Show whether Proton DOM hooks are working correctly
- Detect when Proton UI changes may have broken selectors or actions
- Present this in a calm, useful way with recovery guidance

## Tech Stack
- Frontend: Vite + TypeScript + React + shadcn/ui + Tailwind CSS
- Backend & Storage: Use your judgement
- Auth: Email/password optional only if user profiles/settings sync are added
- Runtime note: Product should be framed as a browser extension or userscript-style interface layer that can be managed through the app experience

## Design Guidelines

### Emotional Thesis
Feels like a trusted power-user cockpit: familiar enough to disappear, fast enough to feel liberating, and kind enough to reduce email fatigue.

### Typography
- Use a clean sans-serif system with strong hierarchy and high scanability
- H1: confident, compact, high contrast
- H2–H4: crisp and structured, with minimal ornament
- Body: highly readable, generous line-height at 1.5× or more
- Caption: quiet but clear for shortcut hints and system notices
- Tone should feel technical and controlled, but never cold

### Color System
- Primary: #1F6FEB — confident action blue for trust and control
- Accent: #7C3AED — subtle power-user energy for overlays and active states
- Background: #F8FAFC — calm near-white for focus
- Surface: #FFFFFF — clean working canvas
- Text: #0F172A — strong readability
- Success: #15803D
- Warning: #B45309
- Error: #B91C1C
- Maintain WCAG AA contrast minimums and avoid overly saturated UI noise

### Layout & Spacing
- Use an 8pt grid
- Favor tight but breathable spacing: this is a productivity product, so it should feel efficient, not sparse
- Single clear primary action per section
- Cards and panels should be structured and quiet, with obvious information hierarchy
- Responsive by default, but optimize for desktop-first keyboard-heavy workflows

### Motion & Interactions
- Motion should feel like kindness through continuity
- Use subtle fades, tiny position shifts, and quick confirmation feedback
- Standard durations: 200–250ms
- Avoid flashy animation; this product should feel fast and dependable
- Hover, focus, and active states should communicate confidence without distraction

## System consistency
- All visuals should reinforce one idea: this tool removes friction
- Shortcut hints, labels, status messages, and focus states must all feel part of one coherent system
- The UI should feel more like a precision instrument than a generic SaaS dashboard

## Accessibility

### Full keyboard navigation support
- Strong visible focus states
- ARIA labels for overlays, dialogs, and toggles
- Avoid trapping focus
- Respect text-entry fields and screen-reader semantics

### Adaptive memory
If expanding this later, keep the same emotional language: fast, familiar, forgiving, invisible

## Design Integrity Review
- Does the layout reduce friction immediately?
- Do typography, spacing, and motion support focused speed?
- Does the product feel like a kind productivity layer rather than a hacky patch?
- Would a Gmail power user feel instantly at home?

## Final Reflection

This product wins by protecting a user’s existing email instincts. The emotional core is not novelty, but continuity: users should feel like they switched providers, not that they lost a decade of muscle memory. Technically, the experience should be stable, scope-aware, and resilient; emotionally, it should feel invisible, competent, and deeply respectful of attention.
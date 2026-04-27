# YourBarber — Master Build Spec (Technical Manifest)
*Version 2.0 — Post-Interrogation Refinement, 2026-04-27*
*Generated via Gemini interrogation session*

**Core Philosophy:** "Memory over Booking." High-utility, zero-app friction for clients, high-retention for barbers.

---

## 1. Architectural Overview

| Interface | Platform | Trust Level |
|---|---|---|
| Barber/Shop | Native App (iOS/Android) or Pro Web Dashboard | High-trust, administrative |
| Client | Mobile Web-App (PWA) — no download required | Low-friction, OTP-secured |

**Authentication:**
- Barbers: Email/Password + Shop ID
- Clients: Phone Number + SMS OTP (single-session persistence)

---

## 2. The "Primary vs. Secondary" Data Model

The system must distinguish between a client's "Home Shop" and "Guest Visits."

### A. The "Primary" Shop (Full Access)
- **Access Level:** Can see Technical_Specs (Photos/Grades) AND The_Story (Personal notes: kids, holidays, hobbies)
- **Control:** Manages SMS marketing and "Win-Back" triggers
- **Logic:** A client has exactly ONE Primary Shop at a time

### B. The "Secondary" Shop (Guest Access)
- **Access Level:** Read-only access to last 10 Technical_Specs and photos
- **Restriction:** The_Story notes are hidden. Marketing triggers are disabled.
- **Conversion Hook:** UI must display a "Claim Primary Status" CTA for the barber

---

## 3. The Family Ledger

The system must handle 1-to-many relationships for parents and children.

**Database Schema:**
- `Users` table (Primary Phone) → `Profiles` table (Sub-identities: Self, Child 1, Child 2)

**Check-in Workflow:**
1. User scans Wall QR
2. Browser displays Profile Selection (checkbox list)
3. User selects one or more profiles to "Push" to the Live Queue

**Barber View:** Grouped queue entries (e.g., "Luke + 2 Kids") to allow the barber to manage chair turnover.

---

## 4. The "Smart Nudge" — AVI Engine

Instead of static reminders, implement an **Average Visit Interval (AVI)** calculator.

**Calculation:**
```
AVI = Sum(Days_Between_Last_3_Visits) / 3
```

**Automated Triggers:**
- **The Predictor:** Send SMS at `AVI - 3 days`
- **The Win-Back:** Send SMS at `AVI + 21 days`

**The "Quiet Shop" Override:** A manual toggle for barbers to send an "Empty Chair" blast only to clients currently within their AVI window.

---

## 5. The "Push" Check-In Flow (User Journey)

1. **Entry:** Client scans Wall QR (encoded with Shop_ID)
2. **Auth:** Client enters phone number → receives OTP
3. **Selection:** Client selects "Same Cut" or "New Style" (adds note)
4. **Wait-Time Logic:** System calculates `Position_in_Queue × Shop_Average_Cut_Time` and displays "Est. Wait" to client
5. **Barber Hand-off:** Barber sees "Checked-In" status. Clicking the name opens the Technical Card (Photos/Grades) without further authentication.

---

## 6. Technical Requirements

### Guided Photography
Camera UI must show a "ghost overlay" for Front, Back, Left, and Right views to ensure consistent haircut history.

### Offline Fallback
LocalStorage must cache:
- The current day's queue
- The last visited client profiles for the Barber App

### Privacy / GDPR
"Transfer Primary" function must trigger a hard-delete of The_Story notes on the previous shop's database after 30 days.

---

## 7. Revenue & Growth Hooks (SaaS Layer)

**The "Passport" Share**
Generate a unique, time-limited URL for clients to show "Away" barbers.

**B2B Referral**
The "Away" barber's view must include: `"Powered by YourBarber — Improve your shop's retention"` link.

**Google Review Bridge**
Logic to trigger a Google Review prompt ONLY if the internal "Haircut Rating" is 5 stars.

---

## Build Brief (Summary for Dev Hand-off)

> "Build a system that prioritizes a Barber's speed and a Shop Owner's data retention. The core feature is the 'Memory Bank' — a technical record of haircuts (photos + grades) that remains portable for the client but builds a deep 'Relationship Story' for the primary shop. Focus on a Push-Check-In logic where the client scans a wall QR to join the queue and unlock their specs for the barber."

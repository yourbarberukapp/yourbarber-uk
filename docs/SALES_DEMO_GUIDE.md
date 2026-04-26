# YourBarber — Sales & Demo Guide 🚀

This document outlines the current high-conversion sales funnel and how to perform a "WOW" demonstration for shop keepers.

## 1. The Sales Funnel Overview
We have built a dedicated sales path to convert barbershops by highlighting our **0% Commission** model and **Data Ownership**.

- **Pricing Page**: `/pricing` — Features a direct comparison against Booksy and Fresha. Use this to show the "Tax" barbers are currently paying.
- **Demo Hub**: `/demo-hub` — The central "Salesperson's Toolbox." Explains the 3-screen ecosystem and provides direct launch buttons.

---

## 2. The 3-Screen System
During a demo, emphasize that YourBarber is an ecosystem, not just an app:

1. **Customer Kiosk (The Wall)**: Scanned via QR. Zero friction arrival.
2. **Barber Mode (The Pocket)**: Mobile-first queue management for staff.
3. **Owner Dashboard (The Desk)**: Full administrative control and analytics.

---

## 3. The "WOW" Arrival Demo
The Kiosk flow is designed to feel like a premium members club.

### Variation A: The Returning Regular (0% Friction)
- **Phone Number**: `07700900000`
- **Experience**: 
  - System recognizes the name instantly.
  - Greeting: *"Welcome back, Test Customer!"*
  - Action: One-tap **"Quick Check-in"** skips all steps.
  - **The Close**: "Show the shop keeper how their regulars don't even have to type their name."

### Operational Control (The "Cost" Argument)
During the demo, mention that owners have full control over SMS costs:
- **Barber Reminders Toggle**: In Settings, the owner can disable staff's ability to send manual reminders. This prevents spamming and unexpected bills.

### Variation B: The New Customer (Warm Welcome)
- **Phone Number**: Any new number (e.g., `07700111222`)
- **Experience**:
  - Friendly welcome: *"First time here? We just need your name."*
  - Engagement: Frames the wait as a service: *"Take a seat, grab a drink... while you wait, tell us what you're after."*

### The "Next Steps" Screen
After checking in, the customer is guided through:
1. Grabbing a complimentary drink.
2. Taking a seat.
3. Browsing the **Trend Gallery** via the "Browse Hair Ideas" button.

---

## 4. The Premium Booking Experience (SMS OTP)
When a customer wants to **Book Now** from the shop's microsite:
1. **Frictionless Entry**: They enter their mobile number. No password to remember.
2. **Instant Verification**: They receive a 5-digit code via SMS.
3. **The Benefit**: This prevents "Ghost Bookings" (fake numbers) and ensures the shop owner has a verified lead.
4. **New User Path**: If they've never booked before, after verifying their phone, the system asks for their name and stores it for all future visits.

**Demo Flow**:
- Go to `/shop/benj-barbers/book`
- Click "Login with Phone"
- Enter your mobile (get the code)
- Verify and proceed to book.

---

## 5. Live Demo Credentials
Use these to show the different app modes. These are pre-seeded in the database.

| Role | Email / Slug | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@benjbarbers.com` | `owner123` |
| **Barber** | `jake@benjbarbers.com` | `barber123` |
| **Kiosk** | `/arrive/benj-barbers` | (Public) |

> [!IMPORTANT]
> **Switching Accounts**: Your browser remembers who you are. If you log in as a Barber, you must **Sign Out** before you can log in as the Owner. I've added a "Sign Out First" button to the `/demo-hub` to make this easy during your pitch.

---

## 6. Technical Setup (For Work PC)
When you download the repo on your work PC:

1. **Install Dependencies**: `npm install`
2. **Env Setup**: Ensure `.env.local` has your `DATABASE_URL`.
3. **Sync DB**: `npx prisma db push`
4. **Seed Data**: `npx prisma db seed` (I have configured this to populate the demo shop automatically).
5. **Run Dev**: `npm run dev`

---

## 7. Version History & Credits
- **Author**: CreativeKorner
- **Last Update**: April 2025 (SMS OTP & Kiosk V2)
- **Domain**: `yourbarber.uk`

# YourBarber — Executive Summary & Build Document
*Generated via ChatGPT interrogation session, 2026-04-27*

---

## 1. Core Vision

YourBarber is **NOT a booking app**.

It is:
- A client retention and haircut memory system
- A communication tool between client and barber
- A revenue engine for barbershops

### The Core Problem
- Clients don't know how to describe their haircut
- Barbers waste time figuring it out
- Clients drift between shops
- Shops lose repeat business

### The Core Solution

> **"Scan → Sit → Same cut every time"**

1. Client walks in
2. Scans QR
3. Barber instantly sees: last haircut, photos, preferences
4. No awkward conversation. Faster, better service.

### The Real Value Proposition
- More repeat visits
- Better consistency
- Less friction

---

## 2. Product Overview (Current System)

### Client Experience
- Logs in via: phone number + 5-digit access code
- Can view: last 10 haircuts, photos (front, sides, back), haircut details (grades, scissors, beard, etc.)
- Receives: SMS reminders for next haircut
- Can: scan QR to check in, join queue, see position in queue

### Barber Experience
- Sees: live queue, client list
- Clicks client → instantly sees haircut history
- During/after cut records: haircut type, grades, beard work, 4 guided photos
- Can quickly flick through past visits

### Shop Owner Experience
- Dashboard: queue, activity, feedback
- Can: manage barbers, edit services/prices, control shop profile

### Microsite (Already Included)
Each shop gets `shopname.yourbarber.uk` with: services, branding, pricing, social links.

---

## 3. Key Gaps — Must Fix Before Scale

### Critical Gaps

**1. Barber Status Tracking**
- Problem: system doesn't know who is busy
- Solution: "Start Cut" / "Finish Cut" triggers

**2. Queue Intelligence**
- Add: estimated wait time
- Option: "Wait for specific barber" OR "Next available"

**3. Authentication Risk**
- Problem: anyone could enter a phone number
- Solution: SMS OTP verification on login

**4. Data Sharing Control**
- Add: "Public haircut card" (limited QR share, no personal data exposed)

**5. Barber Identity Tracking**
- Missing: who cut the hair stored per visit
- Add: barber name on every visit record

**6. Support System**
- Missing: no fallback
- Add: in-app AI chatbot / basic help system

**7. Offline / Failure Mode**
- Missing: no backup if app fails
- Add: last haircut cached locally

---

## 4. New Features — Short-Term Roadmap

### High Priority
- [ ] Barber busy/free status
- [ ] OTP login system
- [ ] Queue wait time estimate
- [ ] Barber selection logic (specific vs next available)
- [ ] Feedback expansion (post 24h)
- [ ] Google review trigger

### Medium Priority
- [ ] Family accounts (parent + children)
- [ ] Client delete/export (PDF haircut history)
- [ ] Shop dashboard metrics: repeat visits, busiest times, barber performance

### Future (Do Not Build Yet)
- AI haircut suggestions
- Smart growth timing
- Advanced analytics
- Marketing automation
- Multi-shop barber accounts

---

## 5. Pricing Strategy

### Core Model
**£49/month per shop** — includes:
- Full system
- Microsite
- Queue system
- Haircut records
- Feedback
- Dashboard
- 100 SMS included
- Additional SMS: ~£0.04 each

### Positioning
> "Everything you need. One price. No nonsense."

### Intro Offer — "Founding Barber"
- £29/month for 12 months
- First 50 shops only

---

## 6. Business Model Reality

| | |
|---|---|
| Cost per shop/month | £3–£10 (tech) |
| Main risk | Support time |
| Target for £5k/month | ~100 shops at £49 |

> You don't need thousands. You need ~100 GOOD shops.

---

## 7. Demo Strategy

### Objective
Not: "show features"  
Yes: **"show how this makes them money"**

### Walk-In Demo Script

**Step 1 — Open**
> "Quick one — how do your customers usually tell you what haircut they want?"

*(They'll laugh / agree it's messy)*

**Step 2 — Problem**
> "And when a different barber cuts them… it's never quite the same, right?"

**Step 3 — Solution**  
*(Show phone)*
> "This solves that. Every client has their last cut saved — photos, grades, everything."

**Step 4 — Magic Moment**
> "They walk in, scan this… you tap their name… done."

**Step 5 — Revenue Hook**
> "If this brings back just one extra customer a day… that's about £1,000 a month extra."

**Step 6 — Close**
> "It's £49 a month. If it doesn't make you more than that, don't use it."

---

## 8. MVP Test Plan

### Phase 1 — 3–5 Barbershops

Test:
- Do barbers actually use it?
- Does it save time?
- Do clients like it?

### Success Criteria
- Barber says: "this makes life easier"
- Client says: "this is handy"
- Shop says: "this brings people back"

> If NOT: do NOT scale. Fix the product first.

---

## 9. Expansion Strategy

**Do NOT:**
- Go global early
- Target developing markets first

**Do:**
1. UK (prove the model)
2. Europe (similar behaviour)
3. Then global

---

## 10. Key Principles

1. **You are NOT selling software** — you are selling repeat customers
2. **Simplicity wins** — barbers won't tolerate complexity
3. **Don't overbuild** — launch fast, fix fast
4. **Don't be cheap** — cheap = ignored
5. **Prove ROI** — this is everything

---

## 11. Final Action List

### Build (Immediate)
- [ ] OTP login
- [ ] Barber busy/available status
- [ ] Queue wait time
- [ ] Barber name stored per visit
- [ ] SMS limits (100 included, then per-SMS)

### Prepare
- [ ] Demo phone version
- [ ] QR code sticker
- [ ] Simple landing page

### Test
- [ ] 3 barbers, real usage, real feedback

### Validate
- [ ] Does it increase visits?

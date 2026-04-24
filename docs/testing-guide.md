# YourBarber — Demo Testing Guide

**App running at:** http://localhost:3001  
**Database:** Neon (live PostgreSQL)  
**Demo shop:** Ben J Barbers — 78A High Street, Poole, BH15 1DB

---

## Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner (Ben) | owner@benjbarbers.com | owner123 |
| Barber (Jake) | jake@benjbarbers.com | barber123 |

**Customer portal test code:** `TEST1`

---

## Test Scenarios

Work through these in order. Each section has a pass/fail check.

---

### 1. Marketing Landing Page

**URL:** http://localhost:3001

- [ ] Page loads with dark background and lime (#C8F135) accents
- [ ] Barlow Condensed font used for headings, Inter for body
- [ ] "Get started" button links to pricing or sign-in
- [ ] Navbar shows YourBarber logo
- [ ] SMS template example reads: "Hi Marcus, it's been 6 weeks since your cut at Ben J Barbers..."
- [ ] Page is responsive — test at mobile width (375px)

**Pass if:** Page looks professional and on-brand. No broken layout.

---

### 2. Barber Login

**URL:** http://localhost:3001/login

- [ ] Page loads with scissors logo and lime accent
- [ ] Enter wrong credentials → "Invalid email or password" error appears
- [ ] Enter `owner@benjbarbers.com` / `owner123` → redirects to `/customers`
- [ ] Sidebar shows "Ben J Barbers" as the shop name
- [ ] Sidebar shows "Ben" as the logged-in user with "Owner" role
- [ ] All nav items visible: Customers, Reminders, Team, Settings (owner sees all four)

**Pass if:** Login works, correct shop name displayed, owner sees all nav items.

---

### 3. Customers List

**URL:** http://localhost:3001/customers

- [ ] Page loads with search bar and filter pills (All / Opted in / Opted out / Not asked)
- [ ] Shows "Test Customer" in the list (from seed)
- [ ] Search by name: type "Test" → customer appears
- [ ] Search by phone: type "07700" → customer appears
- [ ] Clear search → all customers shown
- [ ] Filter by "Opted in" → only opted-in customers shown
- [ ] Click a customer row → navigates to customer detail page
- [ ] "New customer" button is visible (lime, top right)

**Pass if:** Search works, filters work, rows are clickable.

---

### 4. Add New Customer

**URL:** http://localhost:3001/customers/new (or click "New customer")

- [ ] Form loads with phone and name fields
- [ ] Submit without phone → validation error
- [ ] Enter phone `07911 123456`, name `Demo Client` → submit
- [ ] Redirected to new customer's detail page
- [ ] Customer detail page shows phone, name, "No visits yet"
- [ ] Go back to customer list → "Demo Client" appears in list

**Pass if:** Customer is created and visible in the list immediately.

---

### 5. Record a Visit

**URL:** Navigate to Demo Client → "Record visit" button

- [ ] Visit recording page loads
- [ ] Notes textarea accepts free text (e.g. "Skin fade, 1.5 on sides, scissors on top")
- [ ] SMS opt-in radio buttons: Yes / No / Not asked — all three selectable
- [ ] Photo section shows 4 angle buttons: Front, Back, Left, Right
- [ ] Tap a photo angle → device camera / file picker opens
- [ ] Select a photo → thumbnail preview appears in that slot
- [ ] "Skip photos" option is available
- [ ] Select opt-in = **Yes**, add notes, skip photos → submit
- [ ] Redirected back to customer detail page
- [ ] Visit appears in history with notes and opt-in status showing "Opted in"
- [ ] "Last visit" date updates to today

**Pass if:** Visit saved, visible in history, opt-in status correct.

---

### 6. Customer Detail Page

**URL:** http://localhost:3001/customers/[id]

- [ ] Shows customer name, phone, opt-in badge
- [ ] Shows last visit date
- [ ] Visit history section lists all visits in reverse-chronological order
- [ ] Each visit shows: date, barber name, notes
- [ ] Photo thumbnails shown if photos were uploaded
- [ ] "Record visit" button prominent at top
- [ ] Access code shown (e.g. `TEST1` for the seeded customer)

**Pass if:** All customer information displayed correctly.

---

### 7. Reminders Dashboard

**URL:** http://localhost:3001/reminders

- [ ] Page loads showing customers due for a reminder (last visit ≥ 42 days ago)
- [ ] "Test Customer" should appear (seeded with last visit 44 days ago, SMS opt-in = yes)
- [ ] Each row shows: name, phone, days since last visit, opt-in status
- [ ] Checkbox next to each customer to select for bulk send
- [ ] "Select all" works
- [ ] "Send reminders" button is lime, disabled when nothing selected
- [ ] Select Test Customer → click "Send reminders" → confirmation or success message
  - (Twilio not configured in dev — expect a graceful error or mock success, not a crash)

**Pass if:** Due customers listed correctly. Send button activates on selection. No crash on send.

---

### 8. Team Management (Owner only)

**URL:** http://localhost:3001/team

- [ ] Page shows current team: Ben (Owner), Jake (Barber)
- [ ] "Invite barber" form with email and name fields
- [ ] Enter `newbarber@benjbarbers.com`, name `Sam` → invite
- [ ] Sam appears in team list
- [ ] Remove Sam → Sam disappears from list
- [ ] **Log out, log in as Jake (jake@benjbarbers.com / barber123)**
- [ ] Jake's sidebar does NOT show Team or Settings links
- [ ] Navigating directly to /team redirects Jake away (access denied)

**Pass if:** Owner can manage team. Barber cannot access owner-only pages.

---

### 9. Shop Settings (Owner only)

**URL:** http://localhost:3001/settings

- [ ] Page shows current shop name: "Ben J Barbers"
- [ ] Address field shows: "78A High Street, Poole, BH15 1DB"
- [ ] Edit shop name to "Ben J Barbers Poole" → save → success message
- [ ] Refresh page → updated name persists
- [ ] Revert back to "Ben J Barbers" → save

**Pass if:** Settings save and persist on refresh.

---

### 10. Customer Portal — Code Login

**URL:** http://localhost:3001/customer/login

- [ ] Page loads with large code input field (expects 5 chars)
- [ ] Enter wrong code `ZZZZZ` → "We don't recognise that code" error
- [ ] Enter `TEST1` → redirects to customer dashboard
- [ ] Dashboard shows "Test Customer" name and initials avatar
- [ ] Shop name "Ben J Barbers" and address displayed
- [ ] "Last cut: X weeks ago" shown
- [ ] Visit history section shows the seeded visit
- [ ] Access code badge shown in header
- [ ] If a visit has notes → notes displayed under "Barber notes"
- [ ] If photos were uploaded in step 5 → 2×2 photo grid displayed

**Pass if:** Customer can log in with code, sees their cut history.

---

### 11. SMS Short Link (Simulated)

**URL:** http://localhost:3001/c?code=TEST1

- [ ] Immediately redirects to http://localhost:3001/customer/login?code=TEST1
- [ ] Code is pre-filled in the input (uppercased automatically)
- [ ] One tap on "View my cut" → logged in

**Pass if:** Short link → pre-filled login → one-tap access.

---

### 12. Mobile Responsiveness

Test all the above at 390px wide (iPhone 15 viewport):

- [ ] Login page — centred, full-width button
- [ ] Customer list — phone/last visit columns hide gracefully, name + opt-in badge visible
- [ ] Visit recording — camera capture works, 2×2 photo grid fits screen
- [ ] Customer portal — single-column layout, photos fill width
- [ ] Sidebar — collapses to hamburger menu, slides in on tap, closes on nav tap

**Pass if:** No horizontal scroll, no overlapping elements, all core actions reachable.

---

## Known Limitations for Demo

- **SMS not live in dev** — Twilio credentials not configured locally; "Send reminders" will log an error server-side but the UI should not crash. For demo purposes, show the UI flow and explain Twilio fires in production.
- **Photo upload** — S3 not configured locally; photo upload will fail silently. Show the camera capture UI; explain photos go to private S3 storage in production.
- **Access codes for existing customers** — Only the seeded "Test Customer" has a code (TEST1). New customers created during the demo will auto-generate a unique code visible on their detail page.

---

## Quick Demo Flow (5-minute version for a shop owner)

1. Open http://localhost:3001 — show the landing page briefly
2. Go to `/login` — sign in as Ben (owner)
3. Show the Customers list — explain phone-first search
4. Add a new customer with the owner's own phone number
5. Record a visit — fill notes, select "Yes" for SMS opt-in, optionally add a photo
6. Show the customer detail page — their cut on record
7. Go to Reminders — show Test Customer is due; explain the auto-send at 6 weeks
8. Go to `/customer/login`, enter `TEST1` — show the customer's view of their own cut
9. Show the short link: `/c?code=TEST1` — "this is what goes in every SMS"
10. Close with the pitch: "Every reminder sends them back here. Keeps them coming back to you."

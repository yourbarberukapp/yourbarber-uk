# YOUR BARBER — COMPLETE FEATURE PLAYBOOK
## Next.js 14 + PostgreSQL + Vercel + Twilio

**Status:** Current codebase audited. Ready for 3-month development plan.

---

# PART 1: SCHEMA CHANGES (PostgreSQL/Prisma)

## Phase 1: Foundation (Reminders + QR Check-In)

### New Tables

```prisma
// CheckIn — QR code scans at shop
model CheckIn {
  id              String    @id @default(cuid())
  shopId          String
  customerId      String
  barberId        String?   // if barber scanned, or null if customer self-checked
  qrData          String    // JSON or encoded string: {code, selectedCutId, drink, notes}
  selectedCutId   String?   // FK to Visit (the cut they want to recreate)
  drink           String?   // "coffee"|"coke"|"tea"|"water"|null
  notes           String?   // "Shorter this time"
  queuePosition   Int?      // where they are in the queue
  status          String    @default("generated")  // "generated"|"waiting"|"in_progress"|"completed"
  checkedInAt     DateTime  @default(now())
  
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  barber          Barber?   @relation(fields: [barberId], references: [id], onDelete: SetNull)
  
  @@index([shopId, checkedInAt])
  @@index([customerId, checkedInAt])
}

// Feedback — customer ratings & issues post-cut
model Feedback {
  id              String    @id @default(cuid())
  shopId          String
  customerId      String
  visitId         String
  rating          String    // "positive"|"neutral"|"negative"
  issue           String?   // "Left side shorter" | "Too short on top" | etc
  sourceType      String    // "in_shop"|"web" (where feedback came from)
  createdAt       DateTime  @default(now())
  
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  visit           Visit     @relation(fields: [visitId], references: [id], onDelete: Cascade)
  ticket          FeedbackTicket?
  
  @@index([shopId, createdAt])
  @@index([customerId, createdAt])
}

// FeedbackTicket — resolution workflow
model FeedbackTicket {
  id              String    @id @default(cuid())
  feedbackId      String    @unique
  status          String    // "unresolved"|"in_progress"|"resolved"
  resolution      String?   // "same_barber_fix"|"different_barber"|"book_return"|"owner_contact"|"log_only"
  assignedBarberId String?
  preferredDate   DateTime?
  notes           String?   // owner's notes on the issue
  followUpDate    DateTime?
  resolvedAt      DateTime?
  createdAt       DateTime  @default(now())
  
  feedback        Feedback  @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  barber          Barber?   @relation(fields: [assignedBarberId], references: [id], onDelete: SetNull)
  
  @@index([status, createdAt])
}

// Appointment — integrated booking (Phase 2)
model Appointment {
  id              String    @id @default(cuid())
  shopId          String
  customerId      String
  barberId        String?   // optional — customer might not choose
  serviceId       String?   // FK to ShopService (what they're booking)
  scheduledAt     DateTime
  duration        Int       // minutes
  status          String    // "booked"|"in_progress"|"completed"|"cancelled"
  notes           String?
  reminderSentAt  DateTime?
  createdAt       DateTime  @default(now())
  
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  barber          Barber?   @relation(fields: [barberId], references: [id], onDelete: SetNull)
  service         ShopService? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  
  @@index([shopId, scheduledAt])
  @@index([customerId, scheduledAt])
  @@index([barberId, scheduledAt])
}
```

### Schema Updates (Existing Tables)

```prisma
// Customer — add reminder + multi-shop support
model Customer {
  // ... existing fields ...
  
  + preferredReminderWeeks  Int?      // 6 or 8 — defaults to null (not configured)
  + primaryBarberId         String?   // FK to Barber — which barber owns the reminder relationship
  
  barber                    Barber?   @relation("PrimaryBarber", fields: [primaryBarberId], references: [id], onDelete: SetNull)
}

// Barber — add availability + role clarity
model Barber {
  // ... existing fields ...
  
  + calendarUrl             String?   // link to personal Google Calendar (if syncing)
  + acceptsBookings         Boolean   @default(true)
  + workingHours            Json?     // { mon: { open: "09:00", close: "17:00" }, ... }
  
  primary_customers         Customer[] @relation("PrimaryBarber")
  feedbackTickets           FeedbackTicket[]
  checkIns                  CheckIn[]
  appointments              Appointment[]
}

// Visit — add timing + reminder tracking
model Visit {
  // ... existing fields ...
  
  + checkedInAt             DateTime?
  + duration                Int?      // minutes, for calendar blocking
  + reminderScheduledAt     DateTime? // when the 6/8-week reminder was queued
  + finishedAt               DateTime? // when the cut was actually finished (for duration tracking)
  + reminderSentAt          DateTime?
  + cutRating               String?   // "like"|"dislike" — customer rating, not barber feedback
  
  feedbacks                 Feedback[]
  checkIns                  CheckIn[]
}

// Shop — add config
model Shop {
  // ... existing fields ...
  
  + defaultReminderWeeks    Int       @default(6) // barbers can override per-customer
  
  checkIns                  CheckIn[]
  feedbacks                 Feedback[]
  appointments              Appointment[]
}

// ShopService — fix price type
model ShopService {
  // ... existing fields ...
  
  - price                   String?   // DELETE THIS
  + price                   Decimal   @default(0) // now numeric, can calculate
  
  appointments              Appointment[]
}
```

---

# PART 2: DATABASE MIGRATION PLAN

### Migration 1: Add Feedback Tables (Week 1)
```bash
npx prisma migrate dev --name add_feedback_tables
```

### Migration 2: Update Customer + Visit (Week 1-2)
```bash
npx prisma migrate dev --name add_reminders_and_checkin_fields
```

### Migration 3: Add CheckIn + Appointment (Week 2-3)
```bash
npx prisma migrate dev --name add_checkin_and_appointments
```

### Migration 4: Fix ShopService.price (Week 4)
```sql
-- STEP 1: Audit non-numeric values BEFORE running migration (run this first, fix any rows it returns)
SELECT id, name, price FROM "ShopService"
WHERE price IS NOT NULL
  AND price !~ '^[0-9]+(\.[0-9]{1,2})?$';
-- If any rows return (e.g. "£15", "from £10"), update them to bare numbers before continuing.

-- STEP 2: Add new numeric column alongside old one
ALTER TABLE "ShopService" ADD COLUMN "price_new" DECIMAL(10,2);

-- STEP 3: Copy only clean numeric values
UPDATE "ShopService"
SET "price_new" = CAST("price" AS DECIMAL(10,2))
WHERE "price" IS NOT NULL
  AND "price" ~ '^[0-9]+(\.[0-9]{1,2})?$';

-- STEP 4: Swap columns
ALTER TABLE "ShopService" DROP COLUMN "price";
ALTER TABLE "ShopService" RENAME COLUMN "price_new" TO "price";
```
> Then update schema.prisma: `price Decimal? @db.Decimal(10,2)` and run `npx prisma generate`.

---

# PART 3: API ENDPOINTS (DETAILED SPEC)

## NEW ENDPOINTS

### Feedback System

#### POST /api/feedback/create
**When:** Customer taps ☹️ after cut (in shop or web portal)

```typescript
// Request
{
  customerId: string
  visitId: string
  rating: "positive" | "neutral" | "negative"
  issue?: string        // "Left side shorter" or null
  sourceType: "in_shop" | "web"
}

// Response
{
  feedbackId: string
  ticketId: string
  status: "unresolved"
  alertSent: boolean    // SMS + dashboard alert to owner
}

// Database
INSERT INTO Feedback (shopId, customerId, visitId, rating, issue, sourceType)
INSERT INTO FeedbackTicket (feedbackId, status="unresolved")
SEND SMS TO shopOwner: "⚠️ Negative feedback: {customerName} - {issue}"
```

**Implementation Notes:**
- File: `src/app/api/feedback/create/route.ts`
- Auth: customer (via JWT cookie) OR barber (via NextAuth)
- Alert: SMS to shop owner + dashboard notification
- If negative: auto-create FeedbackTicket with status="unresolved"

---

#### PATCH /api/feedback/[feedbackId]/resolve
**When:** Owner decides how to handle issue

```typescript
// Request
{
  resolution: "same_barber_fix" | "different_barber" | "book_return" | "owner_contact" | "log_only"
  assignedBarberId?: string     // required if resolution = different_barber or same_barber_fix
  preferredDate?: DateTime      // for book_return or owner_contact
  notes?: string
}

// Response
{
  ticket: {
    status: "in_progress"
    resolution: string
    smssSent: true
  }
}

// Database + Side Effects
UPDATE FeedbackTicket SET status="in_progress", resolution, assignedBarberId, etc
SEND SMS TO customer based on resolution:
  - same_barber_fix: "{barber} is ready to fix that now. Come back in 10 mins."
  - different_barber: "{barber} (our head barber) will fix it tomorrow."
  - book_return: "Come back {date}, no charge."
  - owner_contact: "{owner name} will call you."
  - log_only: (no SMS, just logged)
SEND SMS TO barber (if assigned): "Fix needed: {customer} - {issue}"
```

**Implementation Notes:**
- File: `src/app/api/feedback/[feedbackId]/resolve/route.ts`
- Auth: owner only (role check)
- SMS: different per resolution type (use conditional template)
- Barber assignment: fetch barber name + send alert

---

#### POST /api/feedback/[feedbackId]/complete
**When:** Barber finishes fixing the cut

```typescript
// Request
{
  barberId: string
  photoUrl?: string     // optional: photo of fix
  notes?: string        // "Leveled both sides, looks good now"
  customerHappy?: boolean
}

// Response
{
  ticket: {
    status: "resolved"
    resolvedAt: DateTime
  }
}

// Database + Side Effects
UPDATE FeedbackTicket SET status="resolved", resolvedAt=now()
UPDATE Visit SET reminderScheduledAt = now() + 6 weeks  // reschedule reminder
SEND SMS TO customer: "All sorted! Enjoy the cut. Next cut on us if not happy. 💈"
SEND SMS TO owner: "✓ Feedback ticket resolved"
```

**Implementation Notes:**
- File: `src/app/api/feedback/[feedbackId]/complete/route.ts`
- Auth: barber (assigned) or owner
- Reschedule reminder: set new reminderScheduledAt on the Visit
- SMS: confirmation + gratitude

---

#### GET /api/feedback?status=unresolved&limit=10
**Dashboard:** Show owner their pending feedback

```typescript
// Response
{
  feedback: [
    {
      id: string
      customerId: string
      customerName: string
      visitId: string
      rating: "negative"
      issue: "Left side shorter"
      sourceType: "web"
      createdAt: DateTime
      ticket: {
        status: "unresolved"
        preferredDate?: DateTime
      }
      visit: {
        barberId: string
        barberName: string
        date: DateTime
      }
    }
  ]
}
```

**Implementation Notes:**
- File: `src/app/api/feedback/route.ts`
- Query params: ?status=, ?limit=, ?createdAfter=
- Dashboard component filters unresolved + shows action buttons
- Pagination: default limit=10, max=100

---

### QR Check-In System

#### POST /api/qr/generate
**When:** Customer pre-selects cut (before arriving or in waiting room)

```typescript
// Request
{
  customerId: string
  selectedCutId: string     // FK to Visit (last cut they want)
  drink?: string            // "coffee"|"coke"|"tea"|"water"
  notes?: string
}

// Response
{
  qrCode: string            // base64 SVG or PNG
  qrUrl: string             // https://api.yourbarber.uk/qr/image/{id}.png
  qrData: string            // decoded: yourbarber.uk/checkin/{customerId}?cut={cutId}&drink=...
  validUntil: DateTime      // 24 hours
  shortLink?: string        // optional: https://yourbarber.uk/qr/{token} (shorter)
}

// Database
INSERT INTO CheckIn (
  shopId, customerId, qrData, selectedCutId, drink, notes
) -- status: generated, not yet scanned
```

**Implementation Notes:**
- File: `src/app/api/qr/generate/route.ts`
- Generate QR code using `qrcode` library (npm install qrcode)
- QR encodes: customerId + selectedCutId + drink + notes (POST params)
- Serve as static image in S3 or inline data URL
- CheckIn row created in "generated" state (not scanned yet)

---

#### POST /api/qr/scan
**When:** Barber scans customer's QR code on iPad

```typescript
// Request
{
  shopId: string
  barberId: string          // who is scanning
  qrData: string            // decoded QR payload
}

// Response
{
  customer: {
    id: string
    name: string
    phone: string
  }
  queuePosition: number
  estimatedWait: number     // minutes
  selectedCut: {
    id: string
    date: DateTime
    photoUrl: string
    barberName: string
    cutDetails: { ... }
  }
  drink?: string
  notes?: string
}

// Database
UPDATE CheckIn SET barberId={barberId}, checkedInAt=now(), queuePosition=calculated
CALCULATE queuePosition: COUNT(CheckIns) WHERE shop=this AND checkedInAt < now()
```

**Implementation Notes:**
- File: `src/app/api/qr/scan/route.ts`
- Auth: barber via NextAuth
- Decode QR payload (should be URL-encoded JSON or query string)
- Fetch customer + last visit with photos
- Calculate queue position in-memory (or keep running counter)
- Queue position = index of this CheckIn in today's chronological list

---

#### POST /api/qr/checkin/start
**When:** Barber taps [START CUT] button

```typescript
// Request
{
  checkInId: string
  barberId: string
}

// Response
{
  status: "in_progress"
}

// Database
UPDATE CheckIn SET status="in_progress", startedAt=now()
UPDATE Visit SET checkedInAt=now() (for the selected cut, if referencing)
QUEUE barber iPad: show countdown timer until expected finish
```

**Implementation Notes:**
- File: `src/app/api/qr/checkin/start/route.ts`
- Start timer on barber's iPad (frontend handles duration estimate)
- Remove customer from "waiting" queue, move to "in-progress"

---

#### POST /api/qr/checkin/finish
**When:** Barber taps [FINISH CUT] button (or auto-capture after duration)

```typescript
// Request
{
  checkInId: string
  visitId: string           // the Visit record created from this cut
  barberId: string
}

// Response
{
  status: "completed"
  reminderPreference: "ask_now"  // show reminder prompt on iPad
}

// Database
UPDATE CheckIn SET status="completed", finishedAt=now()
UPDATE Visit SET finishedAt=now()
Return Visit object for barber to see reminder preference UI
```

**Implementation Notes:**
- File: `src/app/api/qr/checkin/finish/route.ts`
- Next screen on iPad: "Reminder preference?" (6 weeks / 8 weeks / no reminder)
- This is the gate to the existing reminder flow

---

### Reminders (Enhanced)

#### PATCH /api/customers/[customerId]/reminder-preference
**When:** After cut or barber/customer chooses interval

```typescript
// Request
{
  preferredReminderWeeks: 6 | 8 | null   // null = no reminders
  primaryBarberId?: string                // if changing primary barber
}

// Response
{
  customer: { ... }
  nextReminderScheduledFor: DateTime | null
}

// Database
UPDATE Customer SET preferredReminderWeeks={weeks}, primaryBarberId={barberId}
UPDATE Visit SET reminderScheduledAt = now() + {weeks} weeks
```

**Implementation Notes:**
- File: `src/app/api/customers/[customerId]/reminder-preference/route.ts`
- Used after cut: barber selects 6 or 8 weeks
- Calculation: now() + (preferredReminderWeeks * 7 days)
- If changing primary barber: old primary no longer sends reminders

---

#### GET /api/reminders/scheduled (FIXED)
**Existing endpoint — FIXED in this playbook**

**Bugs to fix:**
1. Add `accessCode` to the customer select
2. Fix barberName (should be from last visit or omitted)
3. Pass accessCode to buildSmsMessage()

```typescript
// BEFORE (broken):
const customers = await db.customer.findMany({
  where: { ... },
  select: { id, phone, name, lastVisitAt }  // ← missing accessCode
})
buildSmsMessage({ name: customer.name, shopName, barberName: shop.name })

// AFTER (fixed):
const customers = await db.customer.findMany({
  where: { ... },
  select: { id, phone, name, lastVisitAt, accessCode }  // ← add accessCode
})

// Get barber name from last visit
const lastVisit = await db.visit.findFirst({
  where: { customerId: customer.id },
  orderBy: { visitedAt: 'desc' },
  select: { barber: { select: { name: true } } }
})

buildSmsMessage({
  name: customer.name,
  shopName,
  barberName: lastVisit?.barber?.name,  // ← from visit, not shop
  accessCode: customer.accessCode       // ← PASS THIS
})

// SMS message now includes link:
// "Hi {name}, it's been 6 weeks since your cut...
//  View your cut: yourbarber.uk/c?code={accessCode} [QR link]"
```

**File to fix:** `src/app/api/reminders/scheduled/route.ts` (3-5 line changes)

---

#### POST /api/reminders/preview
**New:** Let owner test reminder before sending

```typescript
// Request
{
  customerId: string
  reminderType: "overdue" | "upcoming"  // what kind of reminder?
}

// Response
{
  message: string
  wouldSendToPhone: string
  previewUrl: string  // yourbarber.uk/c?code=ABC12
}

// No database changes — read-only preview
```

**Implementation Notes:**
- File: `src/app/api/reminders/preview/route.ts`
- Build SMS message, return to dashboard for owner to review
- No actual SMS sent
- Useful for testing before bulk sends

---

### Booking System (Phase 2 — April onwards)

#### POST /api/appointments/create
**When:** Customer books or barber creates appointment

```typescript
// Request
{
  customerId: string
  barberId?: string
  serviceId?: string
  scheduledAt: DateTime
  duration?: number        // default from service or 30 mins
  notes?: string
}

// Response
{
  appointment: { ... }
  smsConfirmation: string  // "Your appointment is confirmed for {date} at {time}"
}

// Database
INSERT INTO Appointment
SEND SMS: "Your appointment with {barber} is {date} at {time}"
UPDATE Shop.availability (if calendar-sync)
```

**Implementation Notes:**
- File: `src/app/api/appointments/create/route.ts`
- Availability: initially assume all time slots open (no conflict checking yet)
- SMS: confirmation sent to customer
- Later: add conflict detection + Google Calendar sync

---

#### GET /api/appointments/available
**When:** Customer wants to book or see availability

```typescript
// Query params
?barberId={id}&date={YYYY-MM-DD}

// Response
{
  slots: [
    { time: "09:00", available: true, duration: 30 },
    { time: "09:30", available: false, reason: "booked" },
    { time: "10:00", available: true, duration: 30 },
    ...
  ]
}

// Database
SELECT appointments WHERE barberId=? AND scheduledAt >= date AND scheduledAt < date+1day
CALCULATE free slots: 30-min increments, excluding booked times
```

**Implementation Notes:**
- File: `src/app/api/appointments/available/route.ts`
- Fetch barber's working hours from Barber.workingHours JSON
- Fetch booked appointments, exclude those times
- Default duration: 30 mins per cut
- Return array of 30-min slots + availability flag

---

#### POST /api/appointments/[appointmentId]/remind
**When:** Cron triggers 24 hours before appointment

```typescript
// Request
{
  appointmentId: string
}

// Response
{
  reminded: boolean
  smsId: string
}

// Database
UPDATE Appointment SET reminderSentAt=now()
SEND SMS: "Reminder: You have a cut tomorrow at {time} with {barber}"
```

**Implementation Notes:**
- File: `src/app/api/appointments/[appointmentId]/remind/route.ts`
- Cron job: add to vercel.json at 09:00 UTC daily
- Query: appointments WHERE scheduledAt = tomorrow AND reminderSentAt IS NULL

---

## UPDATED ENDPOINTS

### GET /api/customers/[id] (ENHANCED)
**Add:** recent feedback, upcoming appointments

```typescript
// Current response ← last 10 visits

// ADD:
{
  customer: { ... },
  visits: [ ... ],
  
  + recentFeedback: [
    {
      rating: "negative",
      issue: "Left side shorter",
      createdAt: DateTime,
      ticket: { status: "resolved" }
    }
  ],
  + upcomingAppointment: {
    scheduledAt: DateTime,
    barberId?: string,
    notes?: string
  }
}
```

**File:** `src/app/api/customers/[id]/route.ts` (small addition)

---

### POST /api/customers/[id]/visits (ENHANCED)
**Add:** auto-schedule reminder, feedback capture option

```typescript
// Current request ← visitedAt, notes, cutDetails, smsOptIn

// ADD LOGIC:
IF preferredReminderWeeks is set:
  SET Visit.reminderScheduledAt = now() + (preferredReminderWeeks * 7 days)
ELSE IF smsOptIn was just set to "yes":
  SHOW barber: "Reminder interval?" (6 / 8 weeks radio)
  AWAIT barber selection
  SET reminderScheduledAt

// Response includes:
{
  visit: { ... },
  + nextReminder: { scheduledFor: DateTime },
  + showReminderPrompt: boolean  // "6 or 8 weeks?"
}
```

**File:** `src/app/api/customers/[id]/visits/route.ts` (logic addition)

---

### GET /api/customer/me (ENHANCED)
**Add:** QR code, feedback history, upcoming appointments

```typescript
// Current: last 10 visits with photos

// ADD:
{
  customer: { ... },
  accessCode: string,
  + qrCode: string              // base64 or SVG
  visits: [ ... ],
  + feedbackHistory: [
    {
      visitDate: DateTime,
      rating: "negative"|"positive"|"neutral",
      issue?: string,
      resolution?: string,
      resolvedAt?: DateTime
    }
  ],
  + upcomingAppointment?: {
    barberId: string,
    barberName: string,
    scheduledAt: DateTime,
    reminderDaysBeforeNeed: boolean
  }
}
```

**File:** `src/app/api/customer/me/route.ts` (data assembly)

---

---

# PART 4: FRONTEND FLOWS (React Components)

## New Pages

### /customers/[id]/visit/feedback (After Cut)
**Where:** iPad screen after barber taps [Finish Cut]

```tsx
// Components/flow:
1. "How was the cut?"
   - ☺️ Great!
   - 😐 OK
   - ☹️ Not happy

2. If negative:
   - Text input: "What was the issue?"
   - Multi-select: "What can we do?"
     ○ Fix it now (same barber)
     ○ Fix it now (different barber)
     ○ Come back tomorrow (no charge)
     ○ Speak with owner
     ○ Just feedback (no action)
   - [SUBMIT]

3. API call: POST /api/feedback/create

4. Confirmation: "Thanks for the feedback. We'll sort it."
```

**File:** `src/app/(dashboard)/customers/[id]/visit/feedback/page.tsx`

---

### /reminders (Enhanced Dashboard)
**Where:** Owner sees due reminders + manual send

```tsx
// Tabs:
1. Unresolved Feedback
   - List: rating, issue, customer, age
   - Actions: [Same Barber] [Different] [Book] [Owner] [Log]

2. Upcoming Reminders
   - Customers due in next 7 days
   - Preview SMS message
   - [Send Now] or wait for cron

3. Recent Sends
   - Last 50 SMS reminders sent
   - Delivery status (Twilio)
```

**File:** `src/app/(dashboard)/reminders/page.tsx`

---

### /c/check-in (Customer Check-In Flow)
**Where:** SMS link → customer selects cut before arriving

```tsx
// Screen 1: "Which cut do you want?"
- Last 5 visits as photo tiles
- [Tap to select]

// Screen 2: "What drink?"
- Radio: Coffee / Coke / Tea / Water

// Screen 3: "Any notes?"
- Text input: "Shorter this time"

// Screen 4: "Your QR Code"
- Large QR display
- [Screenshot] [Copy Link] [Save to Photos]

// Back-end: 
- POST /api/qr/generate { selectedCutId, drink, notes }
- Generate QR
- Return for display
```

**File:** `src/app/c/check-in/page.tsx`

---

### /customer/feedback (Customer Portal — Submit Feedback)
**Where:** Customer gives feedback days after cut

```tsx
// "How was your {date} {style} cut?"
// - ☺️ Great!
// - 😐 OK
// - ☹️ Not happy

// If negative:
// Text: "What was the issue?"
// Multi-select resolution:
// - ○ Fix it now
// - ○ Fix it tomorrow
// - ○ Let me know what happened

// [SUBMIT]
// API: POST /api/feedback/create { visitId, rating, issue, sourceType: "web" }
```

**File:** `src/app/customer/feedback/page.tsx`

---

### /dashboard/appointments (Barber Dashboard — April onwards)
**Where:** Barber sees booked appointments + availability

```tsx
// Calendar view:
- Week view showing:
  - Booked appointments (customer name, time, duration)
  - Available slots (grayed, clickable)
  - Break times

// Click slot → create appointment (if barber is setting for customer)
// Confirmation: "Booked for {customer} on {date} at {time}"
```

**File:** `src/app/(dashboard)/appointments/page.tsx` (Phase 2)

---

## Enhanced Components

### PhotoCapture.tsx (Enhanced)
**Add:** Photo rating (❤️ or 👎)

```tsx
// After photo uploaded:
// "Keep this cut?"
// [❤️ Yes, I like it] [👎 No, don't show again]

// State: 
// visit.photos[angle].rating = "like" | "dislike" | null
```

**File:** `src/components/PhotoCapture.tsx`

---

### CustomerCard.tsx (Enhanced)
**Add:** Feedback badge, next reminder date

```tsx
// Card shows:
// - Customer name + phone
// - Last visit date
// + Feedback status: "⚠️ Unresolved issue" (if applicable)
// + Next reminder: "Due in 3 weeks"
// + Upcoming appointment: "Booked for Wed 2pm"
```

**File:** `src/components/CustomerCard.tsx`

---

### QueueDashboard.tsx (NEW)
**Real-time queue on barber's iPad**

```tsx
// Display (updates every 10 seconds):
// Current: [Name] - [Style]
// Time elapsed: 18 mins

// Waiting (5):
// 1. Ahmed (Fade) — 3 mins wait
// 2. Sarah (Lineup) — 33 mins wait
// 3. Jamal (Texture) — 63 mins wait
// etc.

// Buttons: [Finished] [Break] [Help]

// Real-time data: poll GET /api/shop/queue?shopId=
```

**File:** `src/components/QueueDashboard.tsx` (NEW)

---

---

# PART 5: IMPLEMENTATION ROADMAP (12 Weeks)

## Week 1-2: Feedback System Foundation
- [ ] Schema: add Feedback + FeedbackTicket tables
- [ ] Migrate database
- [ ] API: POST /api/feedback/create
- [ ] API: PATCH /api/feedback/[id]/resolve
- [ ] Component: Feedback form (in-shop)
- [ ] Dashboard: Unresolved feedback list + actions

**Deliverable:** Barbers can record negative feedback, owner can resolve

---

## Week 2-3: QR + Check-In Infrastructure
- [ ] Schema: add CheckIn table + Customer.preferredReminderWeeks
- [ ] Schema: add Visit.checkedInAt + reminderScheduledAt
- [ ] Migrate database
- [ ] API: POST /api/qr/generate
- [ ] API: POST /api/qr/scan
- [ ] API: POST /api/qr/checkin/start + /finish
- [ ] Component: QR display page
- [ ] Component: Queue dashboard (on iPad)

**Deliverable:** Customers can scan QR in waiting room, barber sees queue

---

## Week 3-4: Fix Reminders + Integrate with Check-In
- [ ] Fix GET /api/reminders/scheduled (add accessCode, fix barber name)
- [ ] Fix Twilio SMS to include QR link
- [ ] Add SMS dev mock (for testing)
- [ ] API: PATCH /api/customers/[id]/reminder-preference
- [ ] Flow: After cut → barber asks "6 or 8 weeks?"
- [ ] Cron: Schedule reminder based on preferredReminderWeeks
- [ ] Component: Reminder preference prompt (radio buttons)

**Deliverable:** Customers get reminders with QR link, can choose interval

---

## Week 4-5: Customer Portal Enhancements
- [ ] Add feedback submission to /customer page
- [ ] Display customer.accessCode + QR code
- [ ] Show recent feedback history
- [ ] Barber view (GET /api/customers/[id]): show feedback + upcoming appointments
- [ ] SMS short-link: /c?code= auto-pre-fills login form

**Deliverable:** Customers can give feedback from home, see their QR code

---

## Week 5-6: Photo Management + Ratings
- [ ] Schema: add Visit.cutRating field
- [ ] Component: Photo rating (❤️ 👎) after upload
- [ ] API: PATCH /api/visits/[id]/photos/[photoId] to rate
- [ ] API: DELETE /api/visits/[id]/photos/[photoId] for deletion
- [ ] Fix orphaned VisitPhoto cleanup (optional: add cron to delete failed uploads)
- [ ] S3: add DeleteObjectCommand to lib/s3.ts

**Deliverable:** Barbers + customers can rate cuts, delete bad photos

---

## Week 6-7: Appointment System (Phase 2 Start)
- [ ] Schema: add Appointment table
- [ ] Schema: add Barber.workingHours, Barber.acceptsBookings
- [ ] Migrate database
- [ ] API: POST /api/appointments/create
- [ ] API: GET /api/appointments/available
- [ ] API: POST /api/appointments/[id]/remind (24-hour pre-reminder)
- [ ] Cron: Add appointment reminders to vercel.json

**Deliverable:** Integrated booking system (no external link)

---

## Week 7-8: Appointment UI
- [ ] Component: Booking calendar for customer
- [ ] Component: Barber appointment dashboard (week view)
- [ ] Component: Appointment confirmation SMS
- [ ] Link: Replace Shop.bookingUrl with /appointments/new

**Deliverable:** Customers can book appointments in-app

---

## Week 8-9: Multi-Shop Reminders
- [ ] Schema: add Customer.primaryBarberId + Barber.primary_customers relation
- [ ] API: PATCH /api/customers/[id]/set-primary-barber
- [ ] Logic: When reminder scheduled, only primary barber's shop sends SMS
- [ ] Logic: Secondary shops can see customer but don't send reminders
- [ ] Component: Customer portal shows primary + secondary shops

**Deliverable:** Customers who visit multiple shops don't get duplicate reminders

---

## Week 9-10: Analytics + Staff Performance
- [ ] API: GET /api/analytics/staff-performance
  - Cuts/week, feedback rate, average fix time
- [ ] Dashboard: Staff card showing metrics + trending
- [ ] API: GET /api/analytics/reminder-conversion
  - How many reminders convert to visits?
- [ ] Dashboard: Reminder effectiveness chart

**Deliverable:** Owners see which barbers/reminders work best

---

## Week 10-11: Polish + Testing
- [ ] Fix all remaining bugs (photo deletion, SMS mocks)
- [ ] Edge cases: customer with no code, failed uploads, timezone handling
- [ ] Jest tests for critical paths (reminder calc, QR generation, feedback resolution)
- [ ] E2E tests: full feedback flow + QR check-in + appointment booking
- [ ] Load test: reminders cron with 1000+ customers

**Deliverable:** Production-ready system

---

## Week 11-12: Launch Prep
- [ ] Documentation: staff training guide (how to use new features)
- [ ] Security audit: JWT, S3 presigned URLs, Twilio credentials
- [ ] Migration plan: how to onboard existing shops onto new features
- [ ] Beta: soft launch with 2-3 friendly shops, iterate on feedback
- [ ] Go-live: full announcement

**Deliverable:** Live and stable

---

---

# PART 6: SQL/PRISMA MIGRATION SCRIPTS (PostgreSQL — Reference Only)

> **Do not run these SQL scripts directly.** Update `prisma/schema.prisma` with the changes in Part 1,
> then run `npx prisma migrate dev --name <migration_name>` — Prisma generates the correct SQL for your
> PostgreSQL version and tracks it in `prisma/migrations/`. These scripts are reference so you know
> exactly what Prisma will produce. Migration 4 (price type change) is the only one that requires
> manual SQL before running Prisma.

## Migration 1: Feedback Tables

**File:** `prisma/migrations/{timestamp}_add_feedback/migration.sql`

```sql
-- CreateTable Feedback
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "issue" TEXT,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Feedback_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable FeedbackTicket
CREATE TABLE "FeedbackTicket" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolution" TEXT,
    "assignedBarberId" TEXT,
    "preferredDate" TIMESTAMP(3),
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackTicket_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeedbackTicket_feedbackId_key" UNIQUE ("feedbackId"),
    CONSTRAINT "FeedbackTicket_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackTicket_assignedBarberId_fkey" FOREIGN KEY ("assignedBarberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Feedback_shopId_createdAt_idx" ON "Feedback"("shopId", "createdAt");
CREATE INDEX "Feedback_customerId_createdAt_idx" ON "Feedback"("customerId", "createdAt");
CREATE INDEX "FeedbackTicket_status_createdAt_idx" ON "FeedbackTicket"("status", "createdAt");
```

---

## Migration 2: CheckIn + Reminder Fields

**File:** `prisma/migrations/{timestamp}_add_checkin_and_reminders/migration.sql`

```sql
-- AlterTable Customer
ALTER TABLE "Customer" ADD COLUMN "preferredReminderWeeks" INTEGER;
ALTER TABLE "Customer" ADD COLUMN "primaryBarberId" TEXT;

-- AddForeignKey (separate from ADD COLUMN in PostgreSQL)
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_primaryBarberId_fkey"
    FOREIGN KEY ("primaryBarberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable CheckIn
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "barberId" TEXT,
    "qrData" TEXT NOT NULL,
    "selectedCutId" TEXT,
    "drink" TEXT,
    "notes" TEXT,
    "queuePosition" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CheckIn_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- AlterTable Visit
ALTER TABLE "Visit" ADD COLUMN "checkedInAt" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "finishedAt" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "duration" INTEGER;
ALTER TABLE "Visit" ADD COLUMN "reminderScheduledAt" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "cutRating" TEXT;

-- CreateIndex
CREATE INDEX "CheckIn_shopId_checkedInAt_idx" ON "CheckIn"("shopId", "checkedInAt");
CREATE INDEX "CheckIn_customerId_checkedInAt_idx" ON "CheckIn"("customerId", "checkedInAt");
```

---

## Migration 3: Appointments + Shop Config

**File:** `prisma/migrations/{timestamp}_add_appointments/migration.sql`

```sql
-- CreateTable Appointment
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "barberId" TEXT,
    "serviceId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "notes" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Appointment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ShopService"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- AlterTable Barber
ALTER TABLE "Barber" ADD COLUMN "calendarUrl" TEXT;
ALTER TABLE "Barber" ADD COLUMN "acceptsBookings" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Barber" ADD COLUMN "workingHours" JSONB;

-- AlterTable Shop
ALTER TABLE "Shop" ADD COLUMN "defaultReminderWeeks" INTEGER NOT NULL DEFAULT 6;

-- CreateIndex
CREATE INDEX "Appointment_shopId_scheduledAt_idx" ON "Appointment"("shopId", "scheduledAt");
CREATE INDEX "Appointment_customerId_scheduledAt_idx" ON "Appointment"("customerId", "scheduledAt");
CREATE INDEX "Appointment_barberId_scheduledAt_idx" ON "Appointment"("barberId", "scheduledAt");
```

---

# PART 7: INTEGRATION CHECKLIST

Before deploying, confirm:

- [ ] **Database migrations** run cleanly (vercel postgres updated)
- [ ] **Prisma client** regenerated: `npx prisma generate`
- [ ] **Environment variables** set (Twilio, AWS S3, NextAuth secrets)
- [ ] **SMS dev mock** works (console.log instead of real SMS in dev)
- [ ] **QR code library** installed: `npm install qrcode`
- [ ] **S3 bucket** has `/shops/{shopId}/` folder structure
- [ ] **Cron jobs** registered in vercel.json (reminders + appointment reminders)
- [ ] **Tests** pass: Jest + E2E
- [ ] **API docs** updated (what changed, what's new)
- [ ] **Barber training** completed (demo video or walkthrough)

---

# PART 8: QUICK REFERENCE — Feature Summary

| Feature | Status | When | Files |
|---------|--------|------|-------|
| **Feedback System** | Build this first | Week 1-2 | api/feedback/*, Feedback.tsx |
| **QR Code Generation** | Build next | Week 2-3 | api/qr/generate, QrDisplay.tsx |
| **Check-In (iPad Queue)** | Parallel | Week 2-3 | api/qr/scan, QueueDashboard.tsx |
| **Reminder Interval (6/8 wks)** | Fix + enhance | Week 3-4 | api/reminders/*, ReminderPrompt.tsx |
| **Customer Portal Updates** | Week 4-5 | /customer/*, ShowQR.tsx |
| **Photo Rating + Delete** | Week 5-6 | PhotoCapture.tsx, api/visits/.../photos |
| **Booking System** | Phase 2 | Week 6-9 | api/appointments/*, BookingCalendar.tsx |
| **Multi-Shop Reminders** | Week 8-9 | Customer.primaryBarberId logic |
| **Analytics** | Nice-to-have | Week 9-10 | api/analytics/*, Dashboard.tsx |

---

**You have a solid, modern stack. This playbook gets you from a good barbershop app to a _great_ one in 12 weeks.**

**Start with feedback this week. It's the quickest win and unlocks trust immediately.**
